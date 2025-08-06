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
import loader from '@/components/loader/loader.vue';

pdfMake.vfs = pdfFonts.pdfMake.vfs;
const route = useRoute();
const toast = useToast();

const file = ref(null);
const claims = ref([]);
const reUsers = ref([]);
const isLoading = ref(false);
const provider = ref('')
const customer = ref('')


const netClaimAmount = computed(() => claims.value.reduce((accumulator, claim) => {
    return accumulator + claim?.totalAmount;
}, 0));

const fetchRequestedForPayment = async () => {
    isLoading.value = !isLoading.value
    try {
        await api.get(`/claim/payment/requested/list/detail?batchCode=${route.params.id}&providerUuid=${route.params.Uuid}&status=${route.params.status}&page=1&limit=25`,).then((data) => {
            isLoading.value = false;
            claims.value = data;
            genPdf();
            provider.value = data[0].providerName;
            customer.value = data[0].institutionName;
        });
    } catch (error) {
        isLoading.value = false;
        toast.error(error.message);
    }
}

const fetchUsersList = async () => {
    isLoading.value = !isLoading.value
    try {
        await api.get(`/claim/approver/users/list?batchCode=${route.params.id}`,).then((data) => {
            isLoading.value = false;
            reUsers.value = data
            genPdf();

        });
    } catch (error) {
        isLoading.value = false;
        toast.error(error.message);
    }
}

function generateTableBody(services) {
    let body = [
        [
            { text: "S.N", style: "tableHeader" },
            { text: "Name of Main Member", style: "tableHeader" },
            { text: "Name of Patient", style: "tableHeader" },
            { text: "Relationship", style: "tableHeader" },
            { text: "Date of Service", style: "tableHeader" },
            { text: "Claim Amount", style: "tableHeader" },
        ]
    ];

    services.forEach((service, index) => {
        body.push([

            { text: `${index + 1}`, fontSize: 9 },
            { text: `${service.firstName}` + ' ' + `${service.fatherName}` + ' ' + `${service.grandFatherName}`, fontSize: 9 },
            { text: `${service.relationship}` == 'null' ? `${service.firstName}` + ' ' + `${service.fatherName}` + ' ' + `${service.grandFatherName}` : `${service.dependantFirstName}` + ' ' + `${service.dependantFatherName}`, fontSize: 9 },
            { text: `${service.relationship}` == 'null' ? 'Main Member' : `${service.relationship}`, fontSize: 9 },
            { text: `${service.requestPaymentDate}`, fontSize: 9 },
            { text: `${formatCurrency(service.totalAmount)}`, fontSize: 9 },
        ]);
    })

    body.push([
        { text: "Total Amount", colSpan: 5, alignment: 'right', bold: true },
        '',
        '',
        '',
        '',
        { text: `${formatCurrency(netClaimAmount?.value)}`, fontSize: 9, bold: true },
    ]);

    return body;
}

async function genPdf() {
    const bg = await getBgbase64('/crtificate_header_anbessa.png')
    const header = [
        {
            text: 'Health Claim Approval Summary',
            color: '#FF0000',
            margin: [0, 100, 0, 0],
            alignment: 'center',
            fontSize: 14,
            bold: true
        },
        {
            text: 'Particulars of the Policy',
            margin: [10, 5],
            color: '#FF0000',
            alignment: 'start',
            fontSize: 14
        },
        {
            margin: [20, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Customer Name ',
                    bold: true,
                    color: '#000',
                    fontSize: 12
                },
                {
                    width: '*',
                    text: { text: `${customer.value}`, decoration: 'underline' },
                    margin: [5, 0, 0, 0],
                    color: '#000',
                }
            ],
        },
        {
            margin: [20, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Policy Number',
                    bold: true,
                    color: '#000',
                    fontSize: 12
                },
                {
                    width: '*',
                    text: `${claims.value[0].insuranceId}`, decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [20, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Period of Insurance:',
                    bold: true,
                    color: '#000',
                    fontSize: 12
                },
                {
                    width: 'auto',
                    text: 'From:',
                    bold: true,
                    color: '#000',
                    fontSize: 12
                },
                {
                    width: 'auto',
                    text: `${claims.value[0].beginDate}`, decoration: 'underline',
                    margin: [5, 0, 5, 0],
                    color: '#000'
                },
                {
                    width: 'auto',
                    text: 'To',
                    bold: true,
                    color: '#000',
                    fontSize: 12
                },
                {
                    width: '*',
                    text: `${claims.value[0].endDate}`, decoration: 'underline',
                    margin: [5, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            text: 'Particulars of the Claim',
            margin: [10, 5],
            color: '#FF0000',
            alignment: 'start',
            fontSize: 14
        },
        {
            margin: [20, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Provider Name ',
                    bold: true,
                    color: '#000',
                    fontSize: 12
                },
                {
                    width: '*',
                    text: `${provider.value}`, decoration: 'underline',
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
                    text: 'Type of Claim',
                    bold: true,
                    color: '#000',
                    fontSize: 12
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
            margin: [20, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Expense Type :',
                    bold: true,
                    color: '#000',
                    fontSize: 12
                },
                {
                    width: '*',
                    text: 'CREDIT', decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [20, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Expense Month:',
                    bold: true,
                    color: '#000',
                    fontSize: 12
                },
                {
                    width: '*',
                    text: ' Feburary', decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [20, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Total Claim Amount',
                    bold: true,
                    color: '#000',
                    fontSize: 12
                },
                {
                    width: '*',
                    text: `${formatCurrency(netClaimAmount.value)} Birr Only`, decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },

        {
            margin: [20, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Claim Number:',
                    bold: true,
                    color: '#000',
                    fontSize: 12
                },
                {
                    width: '*',
                    text: `${claims.value[0].claimCode}`, decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            text: 'Claims Details :-',
            margin: [10, 5],
            color: '#FF0000',
            alignment: 'start',
            fontSize: 14
        },
        {
            text: "Accepted Claims ",
            margin: [10, 5],
        },
        {
            margin: [10, 5],
            table: {
                widths: ["auto", "*", "*", "auto", "*", "auto"],
                body: generateTableBody(claims.value),
            },
        },
        {
            margin: [10, 5],
            columns: [
                {
                    width: 'auto',
                    text: 'Processed By:',
                    bold: true,
                    color: '#FF0000',
                    fontSize: 12,
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: "Abel Teame", decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
                {
                    width: 'auto',
                    text: 'Comment/Remark:',
                    bold: true,
                    color: '#000',
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: "Processed", decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [90, 5],
            columns: [
                {
                    width: 'auto',
                    text: 'Signature:',
                    bold: true,
                    color: '#000',
                },
                {
                    width: '*',
                    text: '_________________',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
                {
                    width: 'auto',
                    text: 'Date:',
                    bold: true,
                    color: '#000',
                    alignment: 'start'
                },
                {
                    width: '*',
                    text: "2024-03-12", decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000',
                    pageBreak: 'after'
                },
            ],
        },
        {
            margin: [10, 90, 0, 0],
            columns: [
                {
                    width: 'auto',
                    text: 'Checked By:',
                    bold: true,
                    color: '#FF0000',
                    fontSize: 12,
                },
                {
                    width: '*',
                    text: "Brhane Araya",
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
                {
                    width: 'auto',
                    text: 'Comment/Remark:',
                    bold: true,
                    color: '#000',
                },
                {
                    width: '*',
                    text: "Checked", decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [85, 5, 5, 5],
            columns: [
                {
                    width: 'auto',
                    text: 'Signature:',
                    bold: true,
                    color: '#000',
                },
                {
                    width: '*',
                    text: '_________________',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
                {
                    width: 'auto',
                    text: 'Date:',
                    bold: true,
                    color: '#000',
                },
                {
                    width: '*',
                    text: `2024-03-23`, decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },

    ];

    const page1Content = [

        {
            margin: [10, 100, 0, 0],
            columns: [
                {
                    width: 'auto',
                    text: 'Approved By:',
                    bold: true,
                    color: '#FF0000',
                    fontSize: 12,
                },
                {
                    width: '*',
                    text: `${reUsers.value?.[0]?.approverFirstName}   ${reUsers.value?.[0]?.approverFatherName}`, decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
                {
                    width: 'auto',
                    text: 'Comment/Remark:',
                    bold: true,
                    color: '#000',
                },
                {
                    width: '*',
                    text: `${reUsers.value?.[0]?.approverComment}`, decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [85, 5, 5, 5],
            columns: [
                {
                    width: 'auto',
                    text: 'Signature:',
                    bold: true,
                    color: '#000',
                },
                {
                    width: '*',
                    text: '_________________',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
                {
                    width: 'auto',
                    text: 'Date:',
                    bold: true,
                    color: '#000',
                },
                {
                    width: '*',
                    text: `${reUsers.value?.[0]?.approvedDate}`, decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [10, 100, 0, 0],
            columns: [
                {
                    width: 'auto',
                    text: 'Authorized By:',
                    bold: true,
                    color: '#FF0000',
                    fontSize: 12,
                },
                {
                    width: '*',
                    text: `${reUsers.value?.[0]?.authorizerFirstName}   ${reUsers.value?.[0]?.authorizerFatherName}`, decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
                {
                    width: 'auto',
                    text: 'Comment/Remark:',
                    bold: true,
                    color: '#000',
                },
                {
                    width: '*',
                    text: `${reUsers.value?.[0]?.authorizerComment}`, decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
        {
            margin: [85, 5, 5, 5],
            columns: [
                {
                    width: 'auto',
                    text: 'Signature:',
                    bold: true,
                    color: '#000',
                },
                {
                    width: '*',
                    text: '_________________',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
                {
                    width: 'auto',
                    text: 'Date:',
                    bold: true,
                    color: '#000',
                },
                {
                    width: '*',
                    text: `${reUsers.value?.[0]?.authorizedDate}`, decoration: 'underline',
                    margin: [15, 0, 0, 0],
                    color: '#000'
                },
            ],
        },
    ];

    const page2Content = [

    ];

    const page3Content = [

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
    fetchRequestedForPayment();
    fetchUsersList();
})
</script>
<template>
    <SectionMain>
        <div class="flex items-center justify-center h-[40vh]" v-if="isLoading">
            <loader />
        </div>
        <embed type='application/pdf' :src='file' frameborder="0" width="100%" height="800" />
    </SectionMain>
</template>