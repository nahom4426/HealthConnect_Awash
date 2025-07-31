export interface ClaimDetail {
  claimUuid: string;
  insuredPersonUuid: string;
  payerInstitutionContractCode: string;
  payerInstitutionContractName: string;
  payerName: string;
  payerPhone: string;
  title: string;
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  insuredPhone: string;
  insuranceId: string;
  institutionName: string;
  institutionInsuranceNumber: string;
  claimStatus: string;
  status: string;
  payerStatus: string;
  beginDate: string;
  endDate: string;
  providerName: string;
  providerPhone: string;
  providerTinNumber: string;
  providerApprovalStatus: string;
  dependantUuid: string;
  dependantFirstName: string;
  dependantFatherName: string;
  dependantGrandFatherName: string;
  relationship: string;
  dependantGender: string;
  dependantStatus: string;
  dependantBirthDate: string;
  processorComment: string;
  checkerComment: string;
  approverComment: string;
  authorizerComment: string;
}

export interface ClaimLogs {
  actionDate: string;
  phone: string;
  title: string;
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  comment: string;
  status: string;
  previousStatus: string;
}

export interface ClaimedService {
  serviceProvidedUuid: string;
  itemCode: string;
  packageName: string;
  item: string;
  category: string;
  subCategory: string;
  recordNumber: string;
  providedDate: string;
  file: string;
  qty: number;
  unitPrice: number;
  amount: number;
  packageUuid: string;
}

export interface ClaimAttacment {
  claimAttachmentUuid: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  filePath: string;
}
