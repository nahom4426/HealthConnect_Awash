export function parseSchema(product) {
  const raw = product?.schemaJson;
  if (!raw) return { title: 'Proposal', steps: [] };
  try {
    const schema = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      title: schema.title || 'Proposal',
      version: schema.version,
      steps: Array.isArray(schema.steps) ? schema.steps : [],
    };
  } catch {
    return { title: 'Proposal', steps: [] };
  }
}

export function fieldVisible(field, answers) {
  const when = field?.visibleWhen || field?.requiredWhen;
  if (!when?.field) return true;
  return answers?.[when.field] === when.equals;
}

export function fieldRequired(field, answers) {
  if (!fieldVisible(field, answers)) return false;
  return Boolean(field?.required) || Boolean(field?.requiredWhen);
}

export function optionList(field, product) {
  if (field?.id === 'selectedPerils' && product?.perils?.length) {
    return product.perils.map((peril) => ({ label: peril.label, value: peril.code }));
  }
  const options = field?.options || field?.itemTypes || [];
  return options.map((option) => {
    if (option && typeof option === 'object') {
      return { label: option.label || option.value, value: option.value ?? option.label };
    }
    return { label: String(option), value: option };
  });
}

/** Seed one schedule row per required product item type (all of them, not only the first). */
export function defaultScheduleRows(product) {
  const types = product?.itemTypes || [];
  const required = types.filter((type) => type.required);
  const seed = required.length ? required : (types[0] ? [types[0]] : []);
  if (!seed.length) {
    return [{ itemType: 'OTHER', description: '', sumInsured: 1000000 }];
  }
  return seed.map((type) => ({
    itemType: type.code || 'OTHER',
    description: type.label || '',
    sumInsured: 1000000,
  }));
}

/**
 * Ensure every required catalog item type is present on riskItems.
 * Also copies limitAnyOneOccurrence / limitAggregate into those rows when filled.
 */
export function ensureRequiredScheduleItems(answers, product) {
  if (!answers || typeof answers !== 'object') return answers;
  const types = product?.itemTypes || [];
  const required = types.filter((type) => type.required);
  if (!required.length) return answers;

  const limitByType = {
    ANY_ONE_OCCURRENCE: answers.limitAnyOneOccurrence,
    AGGREGATE_LIMIT: answers.limitAggregate,
    ANNUAL_TURNOVER: answers.estimatedAnnualTurnover,
  };

  const rows = Array.isArray(answers.riskItems) ? answers.riskItems.map((row) => ({ ...row })) : [];
  const byType = new Map(rows.map((row) => [row.itemType, row]));

  for (const type of required) {
    const fromLimit = limitByType[type.code];
    const amount = fromLimit != null && fromLimit !== '' ? Number(fromLimit) : NaN;
    const existing = byType.get(type.code);
    if (existing) {
      if (!Number.isNaN(amount) && amount > 0) existing.sumInsured = amount;
      continue;
    }
    rows.push({
      itemType: type.code,
      description: type.label || '',
      sumInsured: !Number.isNaN(amount) && amount > 0 ? amount : 1000000,
    });
  }

  answers.riskItems = rows;
  return answers;
}

export function defaultAnswers(steps, product) {
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const answers = {
    periodFrom: today,
    periodTo: nextYear,
    soleOccupancy: true,
    selectedPerils: [],
  };
  for (const step of steps) {
    for (const field of step.fields || []) {
      if (answers[field.id] !== undefined) continue;
      if (field.type === 'header') continue;
      if (field.type === 'arrangement') answers[field.id] = 'SINGLE_SHIPMENT';
      else if (field.type === 'boolean' || field.type === 'toggle') answers[field.id] = false;
      else if (field.type === 'multiselect' || field.type === 'ports') answers[field.id] = [];
      else if (field.type === 'party' || field.type === 'port' || field.type === 'vessel' || field.type === 'commodity') answers[field.id] = null;
      else if (field.type === 'schedule') {
        answers[field.id] = defaultScheduleRows(product);
      } else {
        answers[field.id] = '';
      }
    }
  }
  return answers;
}

function parseSavedAnswers(json) {
  if (!json) return {};
  if (typeof json === 'object') return json;
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function dateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function hydrateAnswers(proposal, steps, product) {
  const answers = defaultAnswers(steps, product);
  Object.assign(answers, parseSavedAnswers(proposal?.answersJson));
  if (proposal?.proposerName) answers.proposerName = proposal.proposerName;
  if (proposal?.proposerPhone) answers.proposerPhone = proposal.proposerPhone;
  if (proposal?.proposerAddress) answers.proposerAddress = proposal.proposerAddress;
  if (proposal?.occupation) answers.occupation = proposal.occupation;
  if (proposal?.riskAddress) answers.riskAddress = proposal.riskAddress;
  if (proposal?.periodFrom) answers.periodFrom = dateInput(proposal.periodFrom);
  if (proposal?.periodTo) answers.periodTo = dateInput(proposal.periodTo);
  if (proposal?.selectedPerils?.length) answers.selectedPerils = [...proposal.selectedPerils];
  if (proposal?.riskItems?.length) {
    answers.riskItems = proposal.riskItems.map((item) => ({
      itemType: item.itemType,
      description: item.description || '',
      sumInsured: Number(item.sumInsured) || 0,
    }));
  }
  return ensureRequiredScheduleItems(answers, product);
}

export function validateAnswers(steps, answers, product = null) {
  for (const step of steps) {
    // Step visibility hides whole voyage/commercial blocks for Open Cover; field-level
    // visibleWhen alone would still require Mode of conveyance from those hidden steps.
    if (!fieldVisible(step, answers)) continue;
    for (const field of step.fields || []) {
      if (!fieldRequired(field, answers)) continue;
      const value = answers[field.id];
      if (field.type === 'schedule' || field.type === 'multiselect' || field.type === 'ports') {
        if (!Array.isArray(value) || !value.length) return `${field.label || field.id} is required`;
        if (field.type === 'schedule' && value.some((row) => !row.itemType || !Number(row.sumInsured))) {
          return `${field.label || field.id} needs an item type and sum insured`;
        }
        if (field.type === 'schedule' && product?.itemTypes?.length) {
          const present = new Set(value.map((row) => row.itemType));
          const missing = product.itemTypes
            .filter((type) => type.required && !present.has(type.code))
            .map((type) => type.label || type.code);
          if (missing.length) {
            return `Required schedule items are missing: ${missing.join(', ')}`;
          }
        }
      } else if (field.type === 'party' && !value?.id) {
        return `${field.label || field.id} is required`;
      } else if (field.type === 'port' && !(value?.code || (typeof value === 'string' && value))) {
        return `${field.label || field.id} is required`;
      } else if (field.type === 'vessel' && !(value?.imo || (typeof value === 'string' && value))) {
        return `${field.label || field.id} is required`;
      } else if (field.type === 'commodity' && !(value?.hsCode || (typeof value === 'string' && value))) {
        return `${field.label || field.id} is required`;
      } else if (value === undefined || value === null || value === '') {
        return `${field.label || field.id} is required`;
      }
    }
  }
  return '';
}
