<script setup>
import pdfMake from 'pdfmake/build/pdfmake';
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import SectionMain from '@/components/section/SectionMain.vue';
import api from '@/scripts/api';
import * as session from '@/scripts/session';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { getBgbase64, formatCurrency } from '@/util/utils';
import { useToast } from 'vue-toastification';
import { toWords } from 'number-to-words';
import loader from '@/components/loader/loader.vue';

pdfMake.vfs = pdfFonts.pdfMake.vfs;
const route = useRoute();
const toast = useToast();

const file = ref(null);
const claims = ref([]);
const users = ref([]);
const isLoading = ref(false);
const provider = ref('')
const customer = ref('')


const netClaimAmount = computed(() => claims.value.reduce((accumulator, claim) => {
    return accumulator + claim.totalAmount;
}, 0));

const fetchPaid = async () => {
    isLoading.value = !isLoading.value
    try {
        await api.get(`/claim/payment/settled/list/detail?paymentCode=${route.params.bCode}&page=1&limit=25`,).then((data) => {
            isLoading.value = !isLoading.value;
            claims.value = data;
            genPdf();
        });
    } catch (error) {
        isLoading.value = !isLoading.value;
        toast.error(error.message);
    }
}

const fetchUsersList = async () => {
    isLoading.value = !isLoading.value
    try {
        await api.get(`/claim/approver/users/list?batchCode=${route.params.bCode}`).then((data) => {
            isLoading.value = !isLoading.value;
            users.value = data;
        });
    } catch (error) {
        isLoading.value = !isLoading.value;
        toast.error(error.message);
    }
}

function generateTableBody(services) {
    let body = [
        [
            { text: "S.N", style: "tableHeader" },
            { text: "Client Name", style: "tableHeader" },
            { text: "Claim Number", style: "tableHeader" },
            { text: "Service Month", style: "tableHeader" },
            { text: "Amount Requested", style: "tableHeader" },
            { text: "Amount Deducted", style: "tableHeader" },
            { text: "Net Amount", style: "tableHeader" },
        ]
    ];

    services.forEach((service, index) => {
        body.push([

            { text: `${index + 1}`, fontSize: 9 },
            { text: `${service.providerName}`, fontSize: 9 },
            { text: `${service.batchCode}`, fontSize: 9 },
            { text: `Jan`, fontSize: 9 },
            { text: `${formatCurrency(service.totalAmount)}`, fontSize: 9 },
            { text: `0`, fontSize: 9 },
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

async function genPdf() {
    const bg = await getBgbase64('/crtificate_header_anbessa.png')
    const numberInWords = toWords(netClaimAmount.value)
    const header = [
        {
            text: 'Claim Payment Voucher',
            color: '#000',
            margin: [0, 100, 0, 0],
            alignment: 'center',
            fontSize: 28,
            bold: true,
            decoration: 'underline'
        },
        {
            style: ['defaultTopMargin', { fontSize: 12 }],
            alignment: 'right',
            marginTop: 10,
            stack: [
                {
                    marginRight: 60,
                    text: [
                        {
                            text: `CPV No. :`,
                            style: [{ bold: true }, { fontSize: 14 }]
                        },
                        {
                            text: `${claims.value[0].paymentCode}`
                        }

                    ]
                },
                {
                    marginRight: 70,
                    text: [
                        {
                            text: `Date : `,
                            style: [{ bold: true }, { fontSize: 14 }]
                        },
                        {
                            style: { bold: true },
                            text: `${claims.value[0].paidDate}`
                        }
                    ]
                }
            ]
        },
        {
            text: 'Particulars of the Payee',
            margin: [10, 5],
            color: '000',
            alignment: 'start',
            fontSize: 18,
            bold: true
        },
        {
            margin: [40, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Name of Payee:',
                    color: '#000',
                    fontSize: 14
                },
                {
                    width: '*',
                    text: { text: `${claims.value[0].providerName}`, decoration: 'underline' },
                    margin: [5, 0, 0, 0],
                    color: '#000',
                }
            ],
        },
        {
            margin: [40, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Type Of Payment:',
                    color: '#000',
                    fontSize: 14
                },
                {
                    width: '*',
                    text: `${claims.value[0].paymentType}`, decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [40, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Total Amount Requested:',
                    color: '#000',
                    fontSize: 14
                },
                {
                    width: '*',
                    text: `${formatCurrency(netClaimAmount.value)}`, decoration: 'underline',
                    margin: [5, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            text: 'Particulars of the Payment',
            margin: [10, 5],
            color: '000',
            alignment: 'start',
            fontSize: 18
        },
        {
            margin: [10, 5],
            table: {
                widths: ["auto", "*", "*", "auto", "*", "auto", "*"],
                body: generateTableBody(claims.value),
            },
        },
        {
            margin: [20, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Total Net Amount in Words: ',
                    color: '#000',
                    fontSize: 12
                },
                {
                    width: '*',
                    text: `${formatCurrency(netClaimAmount.value)}    (${numberInWords}) Birr Only`, decoration: 'underline',
                    margin: [5, 0, 0, 0],
                    color: '#000',
                },
            ],
        },
        {
            margin: [20, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Description:',
                    bold: true,
                    color: '#000',
                    fontSize: 16
                },
                {
                    width: '*',
                    text: 'Medical Claim', decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [5, 5, 40, 5],
            columns: [
                {
                    width: 'auto',
                    text: 'Prepared By:',
                    bold: true,
                    color: '#000',
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: '_____________________',
                    margin: [10, 0, 0, 0],
                    color: '#000',
                    alignment: 'start'
                },
                {
                    margin: [10, 0, 0, 0],
                    width: 'auto',
                    text: 'Checked By :',
                    bold: true,
                    color: '#000',
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: '_____________________',
                    margin: [10, 0, 0, 0],
                    color: '#000'
                },
                {
                    margin: [10, 0, 0, 0],
                    width: 'auto',
                    text: 'Approved By :',
                    bold: true,
                    color: '#000',
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: '_____________________',
                    margin: [10, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [10, 5],
            columns: [
                {
                    width: 'auto',
                    text: 'Signature:',
                    bold: true,
                    color: '#000',
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: '_____________________',
                    margin: [10, 0, 0, 0],
                    color: '#000'
                },
                {
                    margin: [10, 0, 0, 0],
                    width: 'auto',
                    text: 'Signature :',
                    bold: true,
                    color: '#000',
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: '_____________________',
                    margin: [10, 0, 0, 0],
                    color: '#000'
                },
                {
                    margin: [10, 0, 0, 0],
                    width: 'auto',
                    text: 'Signature :',
                    bold: true,
                    color: '#000',
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: '_____________________',
                    margin: [10, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [10, 5],
            columns: [
                {
                    width: 'auto',
                    text: 'Date :',
                    bold: true,
                    color: '#000',
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: '_____________________',
                    margin: [10, 0, 0, 0],
                    color: '#000'
                },
                {
                    margin: [10, 0, 0, 0],
                    width: 'auto',
                    text: 'Date :',
                    bold: true,
                    color: '#000',
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: '_____________________',
                    margin: [10, 0, 0, 0],
                    color: '#000'
                },
                {
                    margin: [10, 0, 0, 0],
                    width: 'auto',
                    text: 'Date :',
                    bold: true,
                    color: '#000',
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: '_____________________',
                    margin: [10, 0, 0, 0],
                    color: '#000'
                },
            ],
        },


    ];

    const page1Content = [

    ];

    const docDefinition = {
        content: [
            header,
            page1Content,
        ],
        background: {
            image: bg,
            width: 650,
            height: 842
        },
        footer: {
            marginRight: 20,
            style: {
                color: '#ffa'
            },
            text: '',
            alignment: 'right'
        },
        styles: {
            table: {
                body: {
                    fontSize: 8,
                },
            },
            column: {
                border: true,
                lineWidth: 2,
                borderColor: '#000000',
            },
            header: {
                fontSize: 15,
                bold: true,
                margin: [20, 0, 0, 10],
                alignment: 'center'
            },
            headerFirst: {
                fontSize: 15,
                bold: true,
                margin: [0, 100, 0, 5],
                alignment: 'center'
            },
            subheader: {
                fontSize: 10,
                bold: true,
                margin: [0, 5, 0, 5],
                alignment: 'center'
            },
            subheaderFirst: {
                fontSize: 10,
                bold: true,
                margin: [0, 5, 0, 5],
                alignment: 'center'
            },
            sectionHeader: {
                fontSize: 10,
                bold: true,
                margin: [0, 5, 0, 5],
            },
            paragraph: {
                fontSize: 11,
                margin: [0, 5, 0, 0]
            },
            subheader: {
                fontSize: 11,
                margin: [5, 5, 0, 0]
            },
            tableHeader: {
                bold: true,
                fontSize: 10,
                color: "#000",
                margin: [0, 5, 0, 5],
            },
        }
    };

    pdfMake.createPdf(docDefinition).getBlob(blob => {
        file.value = URL.createObjectURL(blob)
    })
}

onMounted(() => {
    fetchPaid();
    fetchUsersList();
})
</script>
<template>
    <SectionMain>
        <div v-if="isLoading" class="flex items-center justify-center h-[100vh]">
            <loader />
        </div>
        <embed type='application/pdf' :src='file' frameborder="0" width="100%" height="800" />
    </SectionMain>
</template>