import ApiService from "@/service/ApiService";

const api = new ApiService()
const path = '/claimconnect/quotation'

export function paypremium(quotationUuid, formData) {
    // Extract the JSON string from FormData and parse it
    const quotationPaymentRequest = JSON.parse(formData.get('quotationPaymentRequest'));

    return api
        .addAuthenticationHeader()
        .put(
            `${path}/pay/${quotationUuid}`,
            formData, // Send the FormData as the body
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                params: {
                    receiptNumber: quotationPaymentRequest.receiptNumber,
                    requestedPremium: quotationPaymentRequest.requestedPremium,
                    netPremium: quotationPaymentRequest.netPremium,
                    revenueStamp: quotationPaymentRequest.revenueStamp,
                    withHoldingTax: quotationPaymentRequest.withHoldingTax,
                    receiptDate: quotationPaymentRequest.receiptDate,
                }
            }
        )
}