import { addToast } from "@/toast";
import type { AsyncResponse } from "@/types/interface";
import type { AxiosResponse } from "axios";

let id = 0;
function* getId() {
  while (true) {
    yield `generated_id_${++id}`;
  }
}

export const genId = getId();
export function getQueryFormObject(query) {
  return Object.keys(query).reduce((querys, q, idx) => {
    querys += `${q}=${query[q]}`;
    if (idx != Object.keys(query).length - 1) querys += `&`;
    return querys;
  }, "?");
}

export const toast = {
  success: (message) => {
    addToast({
      type: "success",
      message,
    });
  },
  error: (message) => {
    addToast({
      type: "error",
      message,
    });
  },
};

export async function fakeReq<T extends any >(time = 200, success: boolean = true, data: T = [] as any, error: string = '', status: number = 200): Promise<AsyncResponse<T>> {
  return new Promise((res) => {
    setTimeout(() => {
      res({
        success,
        data,
        error,
        status
      })
    }, time);
  })
}

export function toasted(
  type: boolean,
  succMsg: string,
  errMsg?: string | ErrorResponse
): void {
  if (type) {
    toast.success(succMsg);
  } else {
    // Check if error is an object with validation errors
    if (
      errMsg &&
      typeof errMsg === 'object' &&
      'properties' in errMsg &&
      errMsg.properties?.errors
    ) {
      // Extract and display all validation errors
      const errorMessages: string[] = [];
      for (const [field, errors] of Object.entries(errMsg.properties.errors)) {
        const fieldName = field
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        if (Array.isArray(errors)) {
          errorMessages.push(`${fieldName}: ${errors.join(', ')}`);
        } else {
          errorMessages.push(`${fieldName}: ${errors}`);
        }
      }
      toast.error(errorMessages.join('; '));
    } else {
      // Fallback to original error message if not a validation error
      const fallbackMsg =
        (typeof errMsg === 'object' ? errMsg?.message : errMsg) ||
        'An error occurred';
      toast.error(fallbackMsg);
    }
  }
}
export function addFullname(data) {
  if (!(data instanceof Array)) return;
  return data.reduce((el, payload) => {
    payload.fullname = `${payload.firstName} ${payload.fatherName} ${payload.grandFatherName}`;
    el.push(payload);
    return el;
  }, []);
}

export function getImageUrlFormBlob(blob) {
  if (!blob) return;
  return URL.createObjectURL(blob);
}

export function getExtension(filename) {
  if (!filename) return;

  const extension = filename.match(/\.([^.]+)$/)?.[1];
  return extension;
}

export function getFileType(filename) {
  if (!filename) return;
  const ext = getExtension(filename);
  if (imageExtensions.includes(ext)) return "img";
  if (documentExtensions.includes(ext)) return "file";
  if (videoFileTypes.includes(ext)) return "video";
}

const response = {
  success: false,
  data: "",
  status: null,
  error: "",
};
export async function allRequest(funs: any): Promise<AsyncResponse> {
  try {
    const keys = Object.keys(funs);

    const res = await Promise.all(keys.map((name) => funs[name]));

    return {
      success: res.every((r) => r.success),
      data: keys.reduce((state, name, idx) => {
        state[name] = res[idx]?.data;
        return state;
      }, {}),
      status: 200,
      error: keys.reduce((state, name, idx) => {
        state[name] = res[idx]?.error;
        return state;
      }, {}),
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      status: err?.response?.status,
      error: err?.message,
    };
  }
}

export function formatCurrency(currencyValue) {
  if ([undefined, null].includes(currencyValue)) return;
  const currencyFormat = new Intl.NumberFormat("am-ET", {
    style: "currency",
    currency: "ETB",
  }).format(parseInt(currencyValue));
  return currencyFormat;
}
export function getColumnValue(key, row) {
  return key.split(".").reduce((all, el) => {
    return all?.[el];
  }, row);
}

export function secondDateFormat(d) {
  if (!d) return " ";
  try {
    const date = new Date(d);
    const dateFormat = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
    return dateFormat;
  } catch (err) {
    return "";
  }
}

export function secondDateFormatWithTime(d) {
  if (!d) return " ";
  try {
    const date = new Date(d);
    const dateFormat = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
    return dateFormat;
  } catch (err) {
    return "";
  }
}

export function getAgeFormDate(date) {
  const now = new Date().getFullYear();
  const age = new Date(date).getFullYear();
  return parseInt(now - age);
}

export async function getBgbase64Url(url) {
  return new Promise(async (res) => {
    const logoBlob = await (await fetch(url)).blob();
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;
      res(base64Image);
    };
    reader.readAsDataURL(logoBlob);
  });
}

export function removeUndefined(values) {
  return JSON.parse(JSON.stringify(values));
}

export function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

export function addYear(date, year) {
  const givenDate = new Date(date);

  // Add two years
  const modifiedDate = new Date(givenDate);
  modifiedDate.setFullYear(modifiedDate.getFullYear() + year);

  console.log(modifiedDate);
  return modifiedDate;
}

export async function aggregateFunctionResponse(req) {
  const keys = Object.keys(req);
  try {
    const res = await Promise.all(keys.map((key) => req[key]));
    return {
      success: true,
      data: keys.reduce((state, el, idx) => {
        state[el] = res?.[idx]?.data;
        return state;
      }, {}),
    };
  } catch (err) {
    return {
      success: false,
      data: "",
      error: err.message,
    };
  }
}

export function getFormData(data) {
  const fd = new FormData();
  Object.keys(data).forEach((key) => {
    fd.append(key, data[key]);
  });
  return fd;
}

export function addDay(date, date2) {
  const givenDate = new Date(date);

  // Add two years
  const modifiedDate = new Date(givenDate);
  modifiedDate.setUTCDate(modifiedDate.getDay() + date2);

  return modifiedDate;
}

export function addDayToDate(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDateToYYMMDD(date) {
  if (!date) return undefined;

  const year = date.getFullYear().toString(); // Extract the last two digits of the year
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month ranges from 0 to 11, so add 1 and pad with leading zero if necessary
  const day = date.getDate().toString().padStart(2, "0"); // Pad day with leading zero if necessary

  return `${year}-${month}-${day}`;
}

export function formatDateToDDMMYY(date) {
  if (!date) return undefined;

  const year = date.getFullYear().toString(); // Extract the last two digits of the year
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month ranges from 0 to 11, so add 1 and pad with leading zero if necessary
  const day = date.getDate().toString().padStart(2, "0"); // Pad day with leading zero if necessary

  return `${year}-${month}-${day}`;
}

export function formatNumber(number) {
  const formatter = new Intl.NumberFormat("en-US");

  const formattedNumber = formatter.format(number);
  return formattedNumber;
}

export const imageExtensions = [
  "jpeg",
  "jpg",
  "png",
  "gif",
  "bmp",
  "tiff",
  "tif",
  "webp",
  "svg",
  "ico",
  "jfif",
  "jpe",
  "jif",
  "jfif-tbnl",
  "jfi",
  "jp2",
  "jpx",
  "j2k",
  "j2c",
  "fpx",
  "pcd",
];

export const documentExtensions = [
  "txt",
  "doc",
  "docx",
  "rtf",
  "pdf",
  "odt",
  "xls",
  "xlsx",
  "csv",
  "ppt",
  "pptx",
  "pps",
  "odp",
  "ods",
  "odp",
  "odg",
  "odf",
  "odc",
  "odm",
  "ott",
  "oth",
  "odft",
  "pub",
  "pages",
  "numbers",
  "key",
];

const videoFileTypes = [
  "mp4",
  "webm",
  "ogg",
  "mpeg",
  "3gpp",
  "3gpp2",
  "x-ms",
  "x-flv",
  "x-matroska",
  "x-ms-wmv",
  "quicktime",
  "x-ms-asf",
  "x-ms-dvr",
  "x-ms-dxv",
  "x-ms-wvx",
  "x-la-asf",
  "x-ms-vob",
  "x-ms-wmx",
  "vnd.dlna.mpeg-tts",
  "vnd.dlna.mpeg-tts-protected",
  "vnd.sealed.mpeg1",
  "vnd.sealed.mpeg4",
  "vnd.sealed.swf",
  "vnd.sealedmedia.softseal.mov",
  "x-f4v",
  "x-fli",
  "x-flic",
  "x-m4v",
  "x-mng",
  "x-ms-ivf",
  "x-sgi-movie",
  "x-smv",
  "x-swf",
  "x-vob",
];
export const routes = [
  "Intramuscular",
  "Nasal",
  "Topical",
  "Intraosasseous",
  "Intrathecal",
  "Intraperitoneal",
  "Intradermal",
  "Nasogastric",
  "Sub Lingual",
  "Per Rectum",
  "Sub Cutaneous",
  "Per Vaginal",
  "Oral",
  "Inhalation",
];
export const FREQUENCY = {
  IMMEDIATELY: { label: "Immediately", values: "1 Hour/s" },
  ONCE_A_DAY: { label: "Once a day", values: "1 Day/s" },
  THRICE_A_DAY: { label: "Thrice a day", values: "3 Day/s" },
  FOUR_TIMES_A_DAY: { label: "four times a day", values: "4 Day/s" },
  EVERY_2_HOURS: { label: "Every 2 hours", values: "12 Day/s" },
  EVERY_3_HOURS: { label: "Every 3 hours", values: "8 Day/s" },
  EVERY_4_HOURS: { label: "Every 4 hours", values: "6 Day/s" },
  EVERY_6_HOURS: { label: "Every 6 hours", values: "4 Day/s" },
  EVERY_8_HOURS: { label: "Every 8 hours", values: "3 Day/s" },
  EVERY_12_HOURS: { label: "Every 12 hours", values: "2 Day/s" },
  ON_ALTERNATIVE_DAYS: { label: "On alternative days", values: "1 Day/s" },
  ONCE_A_WEEK: { label: "Once a week", values: "1 Day/s" },
  TWICE_A_WEEK: { label: "Twice a week", values: "2 Day/s" },
  THRICE_A_WEEK: { label: "Thrice a week", values: "3 Day/s" },
  EVERY_2_WEEKS: { label: "Every 2 weeks", values: "0.50 Day/s" },
  ONCE_A_MONTH: { label: "Once a month", values: "1 Day/s" },
  FIVE_TIMES_A_DAY: { label: "Four times a day", values: "5 Day/s" },
  FOUR_DAYS_A_WEEK: { label: "Four days a week", values: "4 Day/s" },
  FIVE_DAYS_A_WEEK: { label: "Five times a day", values: "5 Day/s" },
};

export const instructions = [
  "Before Meals",
  "Empty stomach",
  "After meals",
  "In the morning",
  "In the evening",
  "At bedtime",
  "Immediately",
  "'As directed",
];

export const Gender = {
  MALE: "Male",
  FEMALE: "Female",
};
export const hospitals = [
  "Tikur Anbessa Hospital",
  "Cadisco Hospital",
  "Ayat Hospital",
  "Lancet Hospital",
  "Biras Hospital",
];