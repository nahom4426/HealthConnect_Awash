import FormBuilderHome from '@/features/shared/form_builder/pages/FormBuilderHome.vue';
import FormBuilderEditor from '@/features/shared/form_builder/pages/FormBuilderEditor.vue';

export const formBuilderRoutes = [
  {
    path: '/form-builder',
    name: 'FormBuilderHome',
    component: FormBuilderHome,
    meta: { title: 'Form Builder', requiresAuth: true }
  },
  {
    path: '/form-builder/:productId',
    name: 'FormBuilderEditor',
    component: FormBuilderEditor,
    meta: { title: 'Form Builder Editor', requiresAuth: true }
  }
];
