<script setup>
import pdfMake from 'pdfmake/build/pdfmake';
import { ref, onMounted } from 'vue';
import SectionMain from '@/components/section/SectionMain.vue';
import api from '@/scripts/api';
import * as session from '@/scripts/session';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { getBgbase64 } from '@/util/utils';
import loader from '@/components/loader/loader.vue';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const file = ref(null)


async function genPdf() {
    const logo = await getBgbase64('/Family.png')
    const policy = await getBgbase64('/policy-photo.png')
    const header = [
        {
            image: logo,
            width: 650,
            height: 100,
            alignment: 'center'
        },
        {
            text: 'Group Medical Insurance Policy',
            margin: [20, 20],
            alignment: 'center'
        },
        {
            image: policy,
            alignment: 'center',
            width: 300,
            height: 200,
            margin: [0, 140, 0, 30]
        },
        {
            margin: [120, 6],
            columns: [
                {
                    width: 'auto',
                    text: 'Policy Owner :',
                    bold: true,
                    color: '#6e91d1',
                    fontSize: 18
                },
                {
                    width: '*',
                    text: '_________________________',
                    margin: [5, 5, 0, 0],
                    color: '#6e91d1',
                },
            ],
        },
        {
            margin: [120, 0, 0, 40],
            columns: [
                {
                    width: 'auto',
                    text: 'Policy Number:',
                    bold: true,
                    color: '#6e91d1',
                    fontSize: 18
                },
                {
                    width: '*',
                    text: '_________________________',
                    margin: [5, 5, 0, 0],
                    color: '#6e91d1'
                },
            ],
        },
        {
            alignment: 'center',
            text: 'Family Insurance Share Company',
            fontSize: 18,
            color: '#e3e4e6'
        },
        {
            alignment: 'center',
            text: 'Addis Ababa, Ethiopia',
            pageBreak: 'after',
        }
    ];

    const page1Content = [
        {
            text: 'PREAMBLE',
            color: '#6e91d1',
            fontSize: 14,
            bold: true,
            alignment: 'left',
            margin: [28.3425 / 0.75, 37.0638 / 0.75, 0, 0],
        },
        {
            text: ['WHEREAS the Insured named in the Policy Schedule has applied to Family Insurance S.C. (ASCO)  through a signed proposal form (hereinafter referred to as the Company) for the medical insurance (hereinafter specified in respect of the Insured) and their dependents (hereinafter referred to as the Members) and has paid the premium as consideration for such insurance.'],
            alignment: 'left',
            margin: [28.3425 / 0.75, 2, 0, 0],
        },
        {
            text: [{ text: 'NOW THIS POLICY WITNESSES ', fontSize: 13, bold: true }, ' that subject to the terms, conditions and exceptions contained herein or endorsed hereon and the benefit limit stated in the Schedule, and  further subject to reasonable premium, the Company will cover the Members medical expenses as herein defined in Section 2 - A, B, C, D, E, & F (as selected by the Insured at the commencement of the period of Insurance) as the direct result of a Member;'],
            alignment: 'left',
            margin: [28.3425 / 0.75, 8, 0, 0],
        },
        {
            ul: [
                { text: '(a) Sustaining accidental bodily injury during the period of insurance', listType: 'none', margin: [45.7542 / 0.75, 6, 0, 0] },
                { text: '(b) Policy Holder Information: Medco Technology Solutions PLC, Family-Med- 001 / 24', listType: 'none', margin: [45.7542 / 0.75, 6, 0, 0] },
                { text: '(c) The proximal cause of the accident/illness being an insured event', listType: 'none', margin: [45.7542 / 0.75, 6, 0, 0] }
            ]
        },
        {
            text: ['PROVIDED that as a condition precedent to the attachment of this insurance the Member shall have submitted, and the Company shall have accepted an Application/Proposal Form which shall be deemed to be incorporated herein and form part of this Contract.'],
            alignment: 'left',
            margin: [28.3425 / 0.75, 8, 0, 0],
        },
        {
            text: ['The insurer and the Member shall be deemed to have disclosed all material facts relating to the risk insured by this policy in the Proposal/Application Form or separately in a letter. In the event of misrepresentation or non-disclosure of such facts the Company shall be entitled to;'],
            alignment: 'left',
            margin: [28.3425 / 0.75, 8, 0, 0],
        },
        {
            ul: [
                { text: '(a) Void this policy and all premiums paid in respect of the Member so affected shall be forfeited.', listType: 'none', margin: [45.7542 / 0.75, 6, 0, 0] },
                { text: '(b) Seek from the member to be reimbursed all costs incurred by the company as a result.', listType: 'none', margin: [45.7542 / 0.75, 6, 0, 0] },
            ]
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
            page2Content,
            page3Content
        ],
        background: {
            canvas: [
                {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 600, // Adjust width as needed
                    h: 800, // Adjust height as needed
                    color: 'white',
                },
            ],
        },
        footer: {
            marginRight: 20,
            style: {
                color: '#ffa'
            },
            text: 'HI There',
            alignment: 'right'
        },
        styles: {
            column: {
                border: true, // Add a black bottom border with 2px thickness
                lineWidth: 2, // Add a black bottom border with 2px thickness
                borderColor: '#000000', // Add a black bottom border with 2px thickness
            },
            header: {
                fontSize: 15,
                bold: true,
                margin: [0, 0, 0, 10],
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
            }
        }
    };

    pdfMake.createPdf(docDefinition).getBlob(blob => {
        file.value = URL.createObjectURL(blob)
    })
}

onMounted(() => {
    genPdf();
})
</script>
<template>
    <SectionMain>
        <div v-if="file == 'null'" class="flex items-center justify-center h-[100vh]">
            <loader />
        </div>
        <embed type='application/pdf' :src='file' frameborder="0" width="100%" height="800" />
    </SectionMain>
</template>