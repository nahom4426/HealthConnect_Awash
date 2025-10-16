import { defineStore } from "pinia";
import { ref } from "vue";

// Status type (JavaScript doesn't enforce types, but we can keep the comments)
const Status = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
};

// Insured interface (using comments for structure)
const Insured = {
  insuredUuid: "",
  email: "",
  firstName: "",
  fatherName: "",
  grandFatherName: "",
  birthDate: "",
  phone: "",
  address: "",
  state: "",
  country: "",
  idNumber: "",
  position: "",
  gender: "",
  status: Status.ACTIVE,
  photoUrl: null,
  photoPath: null,
};

export const insuredMembers = defineStore("insuredStore", () => {
  const insuredMembers = ref([]);

  function getAll() {
    return insuredMembers.value;
  }

  function set(data) {
    console.log("Setting insured members in store:", data);

    // Check if data is valid array
    if (!Array.isArray(data)) {
      console.error("Invalid data format for insured members:", data);
      insuredMembers.value = [];
      return;
    }

    // Map API response to match our Insured interface
    const mappedData = data.map(item => ({
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
      // Prefer signed `profile` URL from API, then other fallbacks
      profile: item.profile || null,
      photoUrl: item.profile || item.profilePictureBase64 || item.photoUrl || null,
      photoPath: item.photoPath || null,
    }));

    insuredMembers.value = mappedData;
  }

  // Alias for set
  function setInsuredMembers(data) {
    console.log("Setting insured members with setInsuredMembers:", data);
    set(data);
  }

  // Alias for set
  function setAll(data) {
    console.log("Setting insured members with setAll:", data);

    // Handle both direct array and paginated response
    const dataArray = Array.isArray(data) ? data : data?.content || [];

    if (!dataArray.length) {
      console.error("No valid data provided to setAll");
      return;
    }

    // Map the API response to your Insured structure
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
      // Prefer signed `profile` URL from API, then other fallbacks
      profile: item.profile || null,
      photoUrl: item.profile || item.photoBase64 || item.profilePictureBase64 || item.photoUrl || null,
      photoPath: item.profilePicturePath || item.photoPath || null,
      dependants: item.dependants || []
    }));

    console.log("Mapped insured members data:", mappedData);
    insuredMembers.value = mappedData;
  }

  function add(data) {
    console.log("Adding insured member to store:", data);
    insuredMembers.value.unshift(data);
  }

  function update(id, data) {
    console.log(`Updating insured member with UUID: ${id}`, data);

    // Debug: log all insured UUIDs to check for matches
    console.log("Available insured UUIDs:", insuredMembers.value.map(i => i.insuredUuid));

    const idx = insuredMembers.value.findIndex(el => el.insuredUuid === id);
    if (idx === -1) {
      console.warn(`[Insured Store] No insured member found with UUID: ${id}`);
      // If not found by UUID, try to add it instead
      if (data.insuredUuid) {
        console.log("Insured member not found for update, adding instead:", data);
        add(data);
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

  function remove(id) {
    const idx = insuredMembers.value.findIndex(el => el.insuredUuid === id);
    if (idx === -1) {
      console.warn(`[Insured Store] No insured member found with UUID: ${id}`);
      return;
    }

    insuredMembers.value.splice(idx, 1);
  }

  // Update insured status
  function updateStatus(id, status) {
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