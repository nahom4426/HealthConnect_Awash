export enum Plan  {
  "Individual Plan" = "Individual_Plan",
  "Family Plan" = "Family_Plan",
  "Family Shared Plan" = "Family_Shared_Plan"
};
export const allMemberTYpes = [
  {
    label: 'Member Only',
    value: 1, 
  },
  {
    label: 'Member + 1',
    value: 2,
  },
  {
    label: 'Member + 2',
    value: 3
  },
  {
    label: 'Member + 3',
    value: 4,
  },
  {
    label: 'Member + 4',
    value: 5
  },
  {
    label: 'Member + 5 or more',
    value: 6
  },
]

export const SharedlMemberTYpes = [
  {
    label: 'Main Member',
    value: 'Member'
  },
  {
    label: 'Spouse',
    value: 'Spouse'
  },
  {
    label: 'Children',
    value: 'Children'
  }
]

export const MaternityMemberTypes = [
  {
    label: 'Female Employee',
    value: 'Female_Employee'
  },
  {
    label: 'Female Spouse',
    value: 'Female_Spouse'
  }
]

export function isFemaleOnlyPackage(packages: FamilyPackage[], coverage: string) {
  const FEMALE_ONLY_PACkAGES = packages.filter(el => el.gender == FamilyPackageGender.FEMALE)
  if(FEMALE_ONLY_PACkAGES.find(el => el.packageName == coverage)) {
    return true
  }
  return false
}

export function getFamilyTypes(packages: FamilyPackage[], coverage: string, plan: string)  {
  if(isFemaleOnlyPackage(packages, coverage)) {
    return MaternityMemberTypes
  }

  if(plan == Plan["Individual Plan"]) return SharedlMemberTYpes

  return allMemberTYpes
}

export enum FamilyPackageGender {
  BOTH = 'BOTH',
  FEMALE = 'FEMALE',
  MALE = 'MALE',
}

export type BenefitRanges = {
  familyBenefitRangeUuid: string,
  packageUuid: string,
  maxLimit: number,
  minLimit: number,
  familySize: number,
  rate: number,
  status: Status
}

export interface FamilyPackage {
  packageUuid: string,
  packageName: string,
  packageCategory: string,
  packageDescription: string,
  benefitRanges: BenefitRanges[],
  minLimit: number,
  maxLimit: number,
  gender: FamilyPackageGender,
  status: Status
}

export interface AsyncResponse<T = any> {
  status?: number;
  success?: boolean;
  data?: T;
  error?: string;
}

export enum ServiceTypes {
  creditService = "Credit Service",
  cashService = "Cash Service",
}

export enum ClaimStatus {
  PROCESSED = "Processed",
  CHECKED = 'Checked',
  APPROVED = 'Approved',
  REQUESTED = 'Requested',
  AUTHORIZED = 'Authorized'

}

export enum Status {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  REQUESTED = "REQUESTED",
  PROCESSED = "PROCESSED",
  CHECKED = "CHECKED",
  APPROVED = "APPROVED",
  AUTHORIZED = "AUTHORIZED",
  REJECTED = "REJECTED"
}

export enum CStatus {
  ACTIVE = "Active",
  PENDING = "Pending",
  SUSPENDED = "Suspended",
}

export interface StoreForPagination {
  getAll: () => any[];
  set: (data: any) => void;
}

export type StatusVaule = "ACTIVE" | "PENDING" | "SUSPENDED";
type Gender = "Male " | " Femail";
type UserType = "Payer";

export type ButtonClickHandler = (event: MouseEvent) => void;

export enum MemberStatus {
  ACTIVE,
  DEACTIVATED,
}

export interface Pagination {
  page: number;
  limit: number;
  search?: string;
}

export interface InsuredPerson {
  insuredUuid: string;
  institutionUuid: string;
  payerInstitutionContractUuid: string;
  email: string;
  title: string;
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  birthDate: string;
  phone: string;
  branchOffice: string;
  position: string;
  idNumber: string;
  insuranceId: string;
  premium: number;
  address1: string;
  address2: string;
  address3: string;
  state: string;
  country: string;
  beginDate: string;
  endDate: string;
  status: Status;
  totalPages: number;
  gender: string;
}

export interface Client {
  id: string;
  IDImage?: string;
  IDImageNumber?: string;
  activationDate: string;
  occupationType: string;
  income: string;
  image?: string;
  organization: string;
  payableBalance: number;
  totalBalance: number;
  user: User;
}

interface Permissions {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Permissions[];
}

export interface User {
  userUuid: string;
  email: string;
  roleName: string;
  title: string;
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  gender: Gender;
  mobilePhone: string;
  userStatus: Status;
  roles: Role[];
  userType: UserType;
  payerUuid: string;
  privileges: string[];
}
