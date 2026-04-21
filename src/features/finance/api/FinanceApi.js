import ApiService from "@/service/ApiService";
    
const api = new ApiService()
const path = '/claimconnect/quotation'

export function paypremium(quotationUuid, data) {
    return api
        .addAuthenticationHeader()
        .put(
            `${path}/pay/${quotationUuid}`,
            data,
            {
                params: {
                    requestedPremium: data?.requestedPremium,
                    netPremium: data?.netPremium,
                    revenueStamp: data?.revenueStamp,
                    withHoldingTax: data?.withHoldingTax,
                    receiptDate: data?.receiptDate,
                }
            }
        )
}