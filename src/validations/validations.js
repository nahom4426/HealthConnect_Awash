import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
});

// TODO: Add validations for other fields

export const registerInstitutionSchema = yup.object({
  institutionName: yup.string().required("Institution Name is required"),
  tinNumber: yup.string().required("TIN Number is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  description: yup.string().required("Description is required"),
  telephone: yup.string().required("Telephone is required"),
  category: yup.string().required("Category is required"),
  address1: yup.string().required("City is required"),
  address2: yup.string().required("Woreda is required"),
  address3: yup.string().required("subCity is required"),
  state: yup.string().required("Region is required"),
  status: yup.string().required("Status is required"),
});

export const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  // institutionUuid: yup.string().uuid('Invalid UUID').required('Institution UUID is required'),
  title: yup.string().required("Title is required"),
  firstName: yup.string().required("First Name is required"),
  fatherName: yup.string().required("Father Name is required"),
  grandFatherName: yup.string().required("Grandfather Name is required"),
  birthDate: yup.date().required("Birth Date is required"),
  phone: yup.string().required("Phone is required"),
  // branchOffice: yup.string().required('Branch Office is required'),
  position: yup.string().required("Position is required"),
  idNumber: yup.string().required("ID Number is required"),
  insuranceId: yup.string().required("Insurance ID is required"),
  address1: yup.string().required("Address 1 is required"),
  address2: yup.string().required("Address 2 is required"),
  address3: yup.string().required("Address 3 is required"),
  state: yup.string().required("State is required"),
  country: yup.string().required("Country is required"),
  status: yup.string().required("Status is required"),
  gender: yup.string().required("Gender is required"),
});

export function validateForm(formFields) {
  const errors = {};

  for (const field in formFields) {
    if (formFields[field].trim() === "") {
      errors[field] = `${field} Value is required`;
    }
  }

  return errors;
}
