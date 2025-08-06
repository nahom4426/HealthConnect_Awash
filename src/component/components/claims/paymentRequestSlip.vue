<script setup>
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { getBgbase64, formatCurrency } from '@/util/utils'
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from "@/scripts/api";
import SectionMain from "@/components/section/SectionMain.vue";
import { toWords } from 'number-to-words';
import { useToast } from 'vue-toastification';
import loader from '@/components/loader/loader.vue';

pdfMake.vfs = pdfFonts.pdfMake.vfs

const route = useRoute();
const toast = useToast();


const isLoading = ref(false);
const peoples = ref([]);
const tableStore = ref([]);
const file = ref();


const fetchDetails = async () => {
    isLoading.value = true
    try {
        await api.get(`/claim/payment/requested/list?status=Requested&page=1&limit=25`).then((data) => {
            isLoading.value = false
            tableStore.value = data
            getPdf();
        })
    } catch (error) {
        isLoading.value = false;
        toast.error(error.message);
    }
}

const fetchPeople = async () => {
    isLoading.value = true
    try {
        await api.get(`/claim/payment/requested/list/detail?batchCode=${route.params.bCode}&providerUuid=${route.params.Uuid}&status=Requested&page=1&limit=25`).then((data) => {
            isLoading.value = false
            peoples.value = data
        })
    } catch (error) {
        isLoading.value = false;
        toast.error(error.message);
    }
}

//
const netClaimAmount = computed(() => peoples.value.reduce((accumulator, service) => {
    return accumulator + service.totalAmount;
}, 0));


function generateTableBody(persons) {
    let body = [
        [
            { text: "S.N", style: "tableHeader" },
            { text: "Full Name", style: "tableHeader" },
            { text: "Gender", style: "tableHeader" },
            { text: "Insurance Id", style: "tableHeader" },
            { text: "Relationship", style: "tableHeader" },
            { text: "Date of Service", style: "tableHeader" },
            { text: "Claim Amount", style: "tableHeader" },
        ]
    ];

    persons.forEach((service, index) => {
        body.push([

            { text: `${index + 1}`, fontSize: 9 },
            { text: `${service.relationship}` == 'null' ? `${service.firstName}  ${service.fatherName} ${service.grandFatherName}` : `${service.dependantFirstName} ${service.dependantFatherName} `, fontSize: 9 },
            { text: `${service.insuredGender}`, fontSize: 9 },
            { text: `${service.insuranceId}`, fontSize: 9 },
            { text: `${service.relationship}` == 'null' ? 'Self' : `${service.relationship}`, fontSize: 9 },
            { text: `${service.requestPaymentDate}`, fontSize: 9 },
            { text: `${formatCurrency(service.totalAmount)}`, fontSize: 9 }
        ]);
    })

    // Add an extra row
    body.push([
        { text: "Total Amount", colSpan: 6, alignment: 'right', bold: true },
        '',
        '',
        '',
        '',
        '',
        { text: `${formatCurrency(netClaimAmount.value)}`, fontSize: 9, bold: true },
    ]);

    return body;
}

onMounted(() => {
    fetchDetails();
    fetchPeople();
})

var currentDate = new Date().toLocaleDateString();
async function getPdf() {
    const bg = await getBgbase64('/crtificate_header_addis.png')
    const numberInWords = toWords(tableStore.value[0].totalAmount);
    const docDefinition = {
        // defaultStyle: {
        //     font: 'sans-serif'
        // },
        // fonts: {
        //     'sans-serif': {
        //         normal: 'Helvetica',
        //         bold: 'Helvetica-Bold',
        //         italics: 'Helvetica-Oblique',
        //         bolditalics: 'Helvetica-BoldOblique'
        //     }
        // },
        content: [
            {
                style: ['defaultTopMargin', { fontSize: 12 }],
                alignment: 'right',
                stack: [
                    {
                        marginRight: 50,
                        text: [
                            {
                                text: `Issued Date: `
                            },
                            {
                                style: { bold: true },
                                text: `${tableStore.value[0].requestPaymentDate}`
                            }

                        ]
                    },
                    {
                        text: [
                            {
                                text: `Claim Number: `,
                            },
                            {
                                style: { bold: true },
                                text: `${tableStore.value[0].batchCode}`
                            }
                        ]
                    }
                ]
            },
            // {
            //     marginTop: 8,
            //     style: { bold: true, fontSize: 13 },
            //     text: `To Family Insurance S.C`
            // },
            {
                alignment: 'center',
                marginTop: 8,
                style: { fontSize: 14 },
                text: [
                    {
                        text: 'Subject: '
                    },
                    {
                        style: { decoration: 'underline', bold: true },
                        text: 'Request Payment of Credited Services'
                    }
                ]
            },
            {
                marginTop: 8,
                style: { fontSize: 14, bold: true },
                text: 'Dear ' + `Anbessa Insurance`
            },
            {
                marginTop: 8,
                stack: [
                    {
                        text: [
                            'I am writing on behalf of  ', { text: `${tableStore.value[0].providerName}`, bold: true, decoration: 'underline' }, '  to request payment for credit services provided to policy holders affiliated with ',
                            { text: tableStore.value[0].institutionName, bold: true, decoration: 'underline' },
                            ' during the month of Mar, 2024.'
                        ]
                    }
                ]
            },
            {
                marginTop: 8,
                text: 'Below are the details of the services rendered:'
            },
            {
                ul: [
                    {
                        text: [
                            { text: '(a) Service Description: ', bold: true },
                            'Medical Credit services'
                        ],
                        listType: 'none',
                        margin: [4, 6, 0, 0]
                    },
                    {
                        text: [
                            { text: '(b) Policy Holder Information: ', bold: true },
                            { text: `${tableStore.value[0].institutionName}` + ', ' + `${tableStore.value[0].institutionInsuranceNumber}`, decoration: 'underline' }
                        ],
                        listType: 'none',
                        margin: [4, 6, 0, 0]
                    },
                    {
                        text: [
                            { text: '(c) Total Amount: ', bold: true },
                            { text: `${formatCurrency(tableStore.value[0].totalAmount)}` + '(' + `${numberInWords}` + ') Birr', bold: true, decoration: 'underline' }
                        ],
                        listType: 'none',
                        margin: [4, 6, 0, 0]
                    },
                ]
            },
            {
                marginTop: 10,
                text: 'We kindly request that you process the payment promptly to ensure the smooth functioning of our hospital operations. Our records indicate that these services were directly related to the policyholders medical needs and were authorized under their insurance coverage.'
            },
            {
                marginTop: 8,
                text: 'Please find attached the necessary supporting documents, including invoices, treatment summaries, and any other relevant paperwork. If there are any additional forms or information required, please let us know, and we will promptly provide them.'
            },
            {
                marginTop: 8,
                text: 'We appreciate your attention to this matter and look forward to receiving the payment at your earliest convenience. If you have any questions or need further clarification, please do not hesitate to contact our billing department.'
            },
            {
                marginTop: 8,
                text: 'Thank you for your cooperation'
            },
            {
                marginTop: 8,
                text: 'Sincerely,'
            },

            {
                marginTop: 20,
                style: { bold: true },
                text: 'Dr. Kahsay Amare,'
            },
            {
                marginTop: 8,
                style: { bold: true },
                text: 'Medical Director of Addis Hiwot Hospital,'
            },
            {
                marginTop: 8,
                style: { bold: true },
                text: '+251-912345678',
                pageBreak: 'after'
            },

            {
                margin: [10, 140, 0, 5],
                table: {
                    widths: ["auto", "*", "*", "auto", "*", "auto", "*"],
                    body: generateTableBody(peoples.value),
                },
            },

        ],
        background: [
            {
                image: bg,
                width: 600,
                height: 800
            }
        ],
        styles: {
            defaultTopMargin: {
                margin: [0, 100, 0, 0]
            },
            tableHeader: {
                bold: true
            }
        }
    }

    pdfMake.createPdf(docDefinition).getBlob(blob => {
        file.value = URL.createObjectURL(blob)
    })
}
</script>
<template>
    <SectionMain>
        <div v-if="isLoading" class="flex items-center justify-center h-[40vh]">
            <loader />
        </div>
        <embed type='application/pdf' :src='file' frameborder="0" width="100%" height="800" />
    </SectionMain>
</template>