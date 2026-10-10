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
  idNumber: "",
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

    // Check if data is valid array
    if (!Array.isArray(data)) {
      console.error("Invalid data format for insured members:", data);
      insuredMembers.value = [];
      return;
    }

    // Map API response to match our Insured interface
    const mappedData = data.map(item => {
      // Handle profile: could be base64 string or URL
      let profileUrl = null;
      if (item.profile) {
        // Check if it's a base64 string (starts with typical base64 chars, not http)
        if (item.profile.startsWith('iVBORw0KGgo') || item.profile.startsWith('/9j/') || !item.profile.startsWith('http')) {
          // It's base64, add data URI prefix
          profileUrl = `data:image/png;base64,${item.profile}`;
        } else {
          // It's already a URL
          profileUrl = item.profile;
        }
      }

      return {
        insuredUuid: item.insuredPersonUuid || item.insuredUuid,
        payerInstitutionContractUuid:
          item.payerInstitutionContractUuid ||
          item.payerInstitutionContractUUID ||
          item.payerInstitutionContractId ||
          item.payerInstitutionContractid ||
          null,
        quotationUuid: item.quotationUuid || null,
        email: item.email || "",
        firstName: item.firstName || "",
        fatherName: item.fatherName || "",
        grandFatherName: item.grandFatherName || item.grandfatherName || "",
        birthDate: item.birthDate || "",
        phone: item.phone || "",
        address: item.address1 || item.address || "",
        state: item.state || "",
        country: item.country || "Ethiopia",
        idNumber: item.idNumber || "",
        position: item.position || "",
        gender: item.gender || "",
        status: item.status || "ACTIVE",
        // ✅ Handle both base64 and URL profiles
        profile: profileUrl,
        photoUrl: profileUrl || item.profilePictureBase64 || item.photoUrl || null,
        photoPath: item.photoPath || null,
        // ✅ Preserve dependents from API response
        dependantResponses: item.dependantResponses || item.dependants || [],
      };
    });

    insuredMembers.value = mappedData;
  }

  // Alias for set
  function setInsuredMembers(data) {
    set(data);
  }

  // Alias for set
  function setAll(data) {

    // Handle both direct array and paginated response
    const dataArray = Array.isArray(data) ? data : data?.content || [];

    if (!dataArray.length) {
      console.error("No valid data provided to setAll");
      return;
    }

    // Map the API response to your Insured structure
    const mappedData = dataArray.map(item => {
      // Handle profile: could be base64 string or URL
      let profileUrl = null;
      if (item.profile) {
        // Check if it's a base64 string (starts with typical base64 chars, not http)
        if (item.profile.startsWith('iVBORw0KGgo') || item.profile.startsWith('/9j/') || !item.profile.startsWith('http')) {
          // It's base64, add data URI prefix
          profileUrl = `data:image/png;base64,${item.profile}`;
        } else {
          // It's already a URL
          profileUrl = item.profile;
        }
      }

      return {
        insuredUuid: item.insuredUuid || item.insuredPersonUuid || '',
        payerInstitutionContractUuid:
          item.payerInstitutionContractUuid ||
          item.payerInstitutionContractUUID ||
          item.payerInstitutionContractId ||
          item.payerInstitutionContractid ||
          null,
        quotationUuid: item.quotationUuid || null,
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
        // ✅ Handle both base64 and URL profiles
        profile: profileUrl,
        photoUrl: profileUrl || item.photoBase64 || item.profilePictureBase64 || item.photoUrl || null,
        photoPath: item.profilePicturePath || item.photoPath || null,
        // ✅ Preserve dependents from API response
        dependantResponses: item.dependantResponses || item.dependants || []
      };
    });

    insuredMembers.value = mappedData;
  }

  function add(data) {
    insuredMembers.value.unshift(data);
  }

  function update(id, data) {

    // Debug: log all insured UUIDs to check for matches

    const idx = insuredMembers.value.findIndex(el => el.insuredUuid === id);
    if (idx === -1) {
      console.warn(`[Insured Store] No insured member found with UUID: ${id}`);
      // If not found by UUID, try to add it instead
      if (data.insuredUuid) {
        add(data);
      }
      return;
    }

    // Use splice for reactive updates
    insuredMembers.value.splice(idx, 1, {
      ...insuredMembers.value[idx],
      ...data,
    });
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