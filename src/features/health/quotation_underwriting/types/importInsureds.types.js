/**
 * @typedef {Object} BenefitPackage
 * @property {string} policyBenefitPackageUuid
 * @property {string} policyUuid
 * @property {string} policyNumber
 * @property {string} packageUuid
 * @property {string} packageName
 * @property {string} benefitGroupCode
 * @property {'Individual_Plan'|'Family_Shared_Plan'|'Dependent_Shared_Plan'} planType
 * @property {'Member'|'Children'|'NA'} individualType
 * @property {number} familySize
 * @property {number} spouseSumAssured
 * @property {number} depSumAssured
 * @property {number} agreedSumAssured
 * @property {number} maxAllowedSlots
 * @property {number} enrolledSlotsCount
 * @property {number} rate
 * @property {number} premium
 * @property {number} numberOfAdultFemale
 * @property {number} numberOfAdultMale
 * @property {number} enrolledAdultFemaleCount
 * @property {number} enrolledAdultMaleCount
 * @property {boolean} spouse
 */

/**
 * @typedef {Object} Dependent
 * @property {string} dependantUuid
 * @property {string} insuredPersonUuid
 * @property {string|null} title
 * @property {string} firstName
 * @property {string} fatherName
 * @property {string} grandFatherName
 * @property {string|null} birthDate
 * @property {'Spouse'|'Child'|'Parent'|'Other'} relationship
 * @property {string} phone
 * @property {string} status
 * @property {string|null} profilePicture
 * @property {string} idNumber
 * @property {'Male'|'Female'} gender
 */

/**
 * @typedef {Object} InsuredPerson
 * @property {string} insuredUuid
 * @property {string} institutionUuid
 * @property {string} payerInstitutionContractUuid
 * @property {string|null} quotationUuid
 * @property {string} email
 * @property {string|null} title
 * @property {string} firstName
 * @property {string} fatherName
 * @property {string} grandFatherName
 * @property {string|null} birthDate
 * @property {string} phone
 * @property {string|null} branchOffice
 * @property {string|null} position
 * @property {string} idNumber
 * @property {string} insuranceId
 * @property {number} premium
 * @property {string} beginDate
 * @property {string} endDate
 * @property {string} status
 * @property {Dependent[]} dependantResponses
 * @property {'Male'|'Female'} gender
 */

/**
 * @typedef {Object} SelectedInsuredEntry
 * @property {InsuredPerson} insured
 * @property {string[]} dependents  - array of dependantUuid strings
 */

/**
 * @typedef {Object} LinkInsuredsRequest
 * @property {string[]} insuredUuids
 * @property {string} benefitGroupCode
 */

export {}; // makes this a module so JSDoc types are importable via @type
