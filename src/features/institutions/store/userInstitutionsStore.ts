import { defineStore } from "pinia";
import { ref } from "vue";

export type Status = "ACTIVE" | "INACTIVE" | "PENDING";

export interface PayerUser {
  userUuid: string;
  email: string;
  title?: string;
  firstName: string;
  fatherName?: string;
  grandFatherName?: string;
  gender?: string;
  mobilePhone?: string;
  roleName?: string;
}

export interface Payer {
  payerUuid: string;
  email: string;
  payerName: string;
  description: string | null;
  telephone: string;
  category: string;
  level?: string;
  address1: string;
  address2: string;
  address3: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  status: Status;
  tinNumber?: string | null;
  dependantCoverage?: boolean;
  payerLogo?: string | null;
  logoBase64?: string | null;
  logoPath?: string | null;
  totalContracts?: number;
  numberOfInsured?: number;
  totalPages?: number;
  contracts?: any[];
  users?: PayerUser[];
  userList?: PayerUser[]; // For backward compatibility
}

export const institutions = defineStore("institutionsStore", () => {
  const institutions = ref<Payer[]>([]);
  const totalPages = ref(1);
  const currentPage = ref(1);
  const itemsPerPage = ref(25);

  function getAll(): Payer[] {
    return institutions.value;
  }

  function set(data: Payer[]): void {
    console.log("Setting institutions in store:", data);
    
    if (!Array.isArray(data)) {
      console.error("Invalid data format for institutions:", data);
      institutions.value = [];
      return;
    }
    
    const mappedData = data.map(item => ({
      payerUuid: item.payerUuid || '',
      email: item.email || '',
      payerName: item.payerName || '',
      description: item.description || null,
      telephone: item.telephone || '',
      category: item.category || '',
      level: item.level || '',
      address1: item.address1 || '',
      address2: item.address2 || '',
      address3: item.address3 || '',
      state: item.state || '',
      country: item.country || 'Ethiopia',
      latitude: item.latitude || 0,
      longitude: item.longitude || 0,
      status: item.status || 'ACTIVE',
      tinNumber: item.tinNumber || null,
      dependantCoverage: item.dependantCoverage || false,
      payerLogo: item.payerLogo || null,
      logoBase64: item.logoBase64 || null,
      logoPath: item.logoPath || null,
      totalContracts: item.totalContracts || 0,
      numberOfInsured: item.numberOfInsured || 0,
      contracts: item.contracts || [],
      users: item.users || item.userList || [], // Handle both users and userList
      totalPages: item.totalPages || 0
    }));
    
    institutions.value = mappedData;
    
    if (data.length > 0 && data[0].totalPages) {
      totalPages.value = data[0].totalPages;
    }
  }

  function setInstitutions(data: Payer[]): void {
    set(data);
  }

  function setAll(data: any[] | { content: any[] }): void {
    const dataArray = Array.isArray(data) ? data : data?.content || [];
    
    if (!dataArray.length) {
      console.error("No valid data provided to setAll");
      return;
    }
    
    const mappedData = dataArray.map(item => ({
      payerUuid: item.payerUuid || '',
      email: item.email || '',
      payerName: item.payerName || '',
      description: item.description || null,
      telephone: item.telephone || '',
      category: item.category || '',
      level: item.level || '',
      address1: item.address1 || '',
      address2: item.address2 || '',
      address3: item.address3 || '',
      state: item.state || '',
      country: item.country || 'Ethiopia',
      latitude: item.latitude || 0,
      longitude: item.longitude || 0,
      status: item.status || 'ACTIVE',
      tinNumber: item.tinNumber || null,
      dependantCoverage: item.dependantCoverage || false,
      payerLogo: item.payerLogo || null,
      logoBase64: item.logoBase64 || null,
      logoPath: item.logoPath || null,
      totalContracts: item.totalContracts || 0,
      numberOfInsured: item.numberOfInsured || 0,
      contracts: item.contracts || [],
      users: item.users || item.userList || [], // Handle both users and userList
      totalPages: item.totalPages || 0
    }));
    
    institutions.value = mappedData;
    
    if (dataArray.length > 0 && dataArray[0].totalPages) {
      totalPages.value = dataArray[0].totalPages;
    }
  }

  function add(data: Payer): void {
    institutions.value.unshift(data);
  }

  function update(id: string, data: Partial<Payer>): void {
    const idx = institutions.value.findIndex((el) => el.payerUuid === id);
    if (idx === -1) {
      if (data.payerUuid) {
        add(data as Payer);
      }
      return;
    }

    institutions.value.splice(idx, 1, {
      ...institutions.value[idx],
      ...data,
    });
  }

  function updateStatus(id: string, status: Status): void {
    update(id, { status });
  }

  function remove(id: string): void {
    const idx = institutions.value.findIndex((el) => el.payerUuid === id);
    if (idx !== -1) {
      institutions.value.splice(idx, 1);
    }
  }

  function setPage(page: number): void {
    currentPage.value = page;
  }

  function setLimit(limit: number): void {
    itemsPerPage.value = limit;
  }

  return {
    institutions,
    totalPages,
    currentPage,
    itemsPerPage,
    getAll,
    set,
    setInstitutions,
    setAll,
    add,
    update,
    updateStatus,
    remove,
    setPage,
    setLimit,
  };
});