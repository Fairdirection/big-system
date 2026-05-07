export type Department = 'Sales' | 'Accounting' | 'Operation' | 'HR' | 'Legal' | 'Admin';

export interface Employee {
  _id: string;
  name: string;
  employeeCode: string;
  department: Department;
  jobTitle: string;
  email: string;
  phone?: string;
  baseSalary: number;
  isActive: boolean;
  hireDate: string;
  terminationDate?: string;
  endDate?: string;
  userId?: string;
  code: string;
  nationalId?: string;
  target: number;
  seniorityLevel?: string;
  currentTeamId?: any;
  currentSeniorityDays?: number;
  dynamicQuarterDays?: number;
  createdAt: string;
  updatedAt: string;
}
