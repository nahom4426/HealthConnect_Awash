import { defineStore } from "pinia";
import { ref } from "vue";

// Status type (adjust if needed)
export type Status = "ACTIVE" | "INACTIVE" | "PENDING"; // or import from "@/types/interface"

// Insured interface
export interface Insured {
  insuredUuid: string;
  email: string;
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  birthDate: string;
  phone: string;
  address: string;
  state: string;
  country: string;
  idNumber: string;
  position: string;
  gender: string;
  status: Status;
  photoUrl?: string;
  photoPath?: string;
}

export const insuredMembers = defineStore("insuredStore", () => {
  const insuredMembers = ref<Insured[]>([]);

  function getAll(): Insured[] {
    return insuredMembers.value;
  }

  function set(data: Insured[]): void {
    console.log("Setting insured members in store:", data);
    
    // Check if data is valid array
    if (!Array.isArray(data)) {
      console.error("Invalid data format for insured members:", data);
      insuredMembers.value = [];
      return;
    }
    
    // Map API response to match our Insured interface
    const mappedData = data.map(item => {
      return {
        insuredUuid: item.insuredPersonUuid || item.insuredUuid,
        email: item.email || "",
        firstName: item.firstName || "",
        fatherName: item.fatherName || "",
        grandFatherName: item.grandFatherName || item.grandfatherName || "",
        birthDate: item.birthDate || "",
        phone: item.phone || "",
        address: item.address1 || item.address || "",
        state: item.state || "",
        country: item.country || "Ethiopia",
        idNumber: item.insuranceId || item.idNumber || "",
        position: item.position || "",
        gender: item.gender || "",
        status: item.status || "ACTIVE",
        photoUrl: item.profilePictureBase64 || item.photoUrl || null,
        photoPath: item.photoPath || null
      };
    });
    
    insuredMembers.value = mappedData;
  }

  // Alias for set
  function setInsuredMembers(data: Insured[]): void {
    console.log("Setting insured members with setInsuredMembers:", data);
    set(data);
  }

  // Alias for set
function setAll(data: any[] | { content: any[] }): void {
  console.log("Setting insured members with setAll:", data);
  
  // Handle both direct array and paginated response
  const dataArray = Array.isArray(data) 
    ? data 
    : data?.content || [];
  
  if (!dataArray.length) {
    console.error("No valid data provided to setAll");
    return;
  }
  
  // Map the API response to your Insured interface
  const mappedData = dataArray.map(item => ({
    insuredUuid: item.insuredUuid || item.insuredPersonUuid || '',
    email: item.email || '',
    firstName: item.firstName || '',
    fatherName: item.fatherName || '',
    grandFatherName: item.grandFatherName || item.grandfatherName || '',
    birthDate: item.birthDate || null,
    phone: item.phone || '',
    address: item.address || item.address1 || '',
    state: item.state || null,
    country: item.country || null,
    idNumber: item.idNumber || item.insuranceId || '',
    position: item.position || null,
    gender: item.gender || '',
    status: item.status || 'ACTIVE',
    photoUrl: item.photoBase64 || item.profilePictureBase64 || null,
    photoPath: item.profilePicturePath || null,
    dependants: item.dependants || []
  }));
  
  console.log("Mapped insured members data:", mappedData);
  insuredMembers.value = mappedData;
}

  function add(data: Insured): void {
    console.log("Adding insured member to store:", data);
    insuredMembers.value.unshift(data);
  }

  function update(id: string, data: Partial<Insured>): void {
    console.log(`Updating insured member with UUID: ${id}`, data);
    
    // Debug: log all insured UUIDs to check for matches
    console.log("Available insured UUIDs:", insuredMembers.value.map(i => i.insuredUuid));
    
    const idx = insuredMembers.value.findIndex((el) => el.insuredUuid === id);
    if (idx === -1) {
      console.warn(`[Insured Store] No insured member found with UUID: ${id}`);
      // If not found by UUID, try to add it instead
      if (data.insuredUuid) {
        console.log("Insured member not found for update, adding instead:", data);
        add(data as Insured);
      }
      return;
    }

    // Use splice for reactive updates
    insuredMembers.value.splice(idx, 1, {
      ...insuredMembers.value[idx],
      ...data,
    });
    console.log("Insured member updated successfully");
  }

  function remove(id: string): void {
    const idx = insuredMembers.value.findIndex((el) => el.insuredUuid === id);
    if (idx === -1) {
      console.warn(`[Insured Store] No insured member found with UUID: ${id}`);
      return;
    }

    insuredMembers.value.splice(idx, 1);
  }

  // Update insured status
  function updateStatus(id: string, status: Status): void {
    console.log(`Updating status for insured member with UUID: ${id} to ${status}`);
    update(id, { status });
  }

  return {
    insuredMembers,
    getAll,
    set,
    setInsuredMembers,
    setAll,
    add,
    update,
    updateStatus,
    remove,
  };
});


