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
  const when = field?.requiredWhen;
  if (!when?.field) return true;
  return answers[when.field] === when.equals;
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
      if (field.type === 'boolean' || field.type === 'toggle') answers[field.id] = false;
      else if (field.type === 'multiselect') answers[field.id] = [];
      else if (field.type === 'schedule') {
        const types = product?.itemTypes || [];
        const required = types.find((type) => type.required) || types[0];
        answers[field.id] = [{
          itemType: required?.code || 'OTHER',
          description: required?.label || '',
          sumInsured: 1000000,
        }];
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
  return answers;
}

export function validateAnswers(steps, answers) {
  for (const step of steps) {
    for (const field of step.fields || []) {
      if (!fieldRequired(field, answers)) continue;
      const value = answers[field.id];
      if (field.type === 'schedule' || field.type === 'multiselect') {
        if (!Array.isArray(value) || !value.length) return `${field.label || field.id} is required`;
        if (field.type === 'schedule' && value.some((row) => !row.itemType || !Number(row.sumInsured))) {
          return `${field.label || field.id} needs an item type and sum insured`;
        }
      } else if (value === undefined || value === null || value === '') {
        return `${field.label || field.id} is required`;
      }
    }
  }
  return '';
}
