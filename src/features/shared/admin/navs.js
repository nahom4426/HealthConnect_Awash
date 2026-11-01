import icons from '@/utils/icons.js';

const administrationNavs = [
  {
    path: '/users',
    name: 'Users',
    icon: icons.users,
  },
  {
    path: '/roles',
    name: 'Roles',
    icon: icons.role,
  },
  {
    path: '/privileges',
    name: 'Privilege',
    icon: icons.privilege,
  },
  {
    path: '/branches',
    name: 'Branches',
    icon: icons.institutinpolicy,
  },
  {
    path: '/audit-log',
    name: 'Audit Log',
    icon: icons.history,
  },
];

export default administrationNavs;
