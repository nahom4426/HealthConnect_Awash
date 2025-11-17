import { defineRule } from "vee-validate";

defineRule("required", (value, [], context) => {
    if (typeof value === "number") {
        return true;
    }
    // return !!value || i18n.global.t("this_field_is_required");
    return !!value || `${context.name} is required`;
});