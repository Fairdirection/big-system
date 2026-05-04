const mongoose = require('mongoose');

const dbUri = 'mongodb://localhost:27017/salesflow';

const EmployeeSchema = new mongoose.Schema({
  name: String,
  code: String,
  department: String,
  jobTitle: String,
  email: String,
  phone: String,
  baseSalary: Number,
  isActive: Boolean,
  hireDate: Date,
  nationalId: String,
  target: Number,
  seniorityLevel: String
}, { timestamps: true });

const ClientSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  code: String,
  isActive: Boolean
}, { timestamps: true });

const SaleSchema = new mongoose.Schema({
  saleNumber: String,
  source: String,
  projectName: String,
  clientId: mongoose.Schema.Types.ObjectId,
  clientName: String,
  unitNumber: String,
  unitType: String,
  unitValue: Number,
  contractDate: Date,
  contractCommissionPercentage: Number,
  grossCommissionWithVAT: Number,
  netRevenue: Number,
  status: String,
  sellers: [{
    employeeId: mongoose.Schema.Types.ObjectId,
    employeeName: String,
    sharePercentage: Number,
    commissionValue: Number
  }]
}, { timestamps: true });

const Employee = mongoose.model('Employee', EmployeeSchema);
const Client = mongoose.model('Client', ClientSchema);
const Sale = mongoose.model('Sale', SaleSchema);

async function seed() {
  await mongoose.connect(dbUri);
  
  // Clear all
  await Employee.deleteMany({});
  await Client.deleteMany({});
  await Sale.deleteMany({});

  // Seed Employees
  const employees = await Employee.create([
    {
      name: 'أحمد محمد علي',
      code: 'EMP-001',
      department: 'Sales',
      jobTitle: 'مدير مبيعات',
      email: 'ahmed.ali@salesflow.com',
      phone: '01012345678',
      baseSalary: 15000,
      isActive: true,
      hireDate: new Date('2022-01-15'),
      nationalId: '29001011234567',
      target: 5000000,
      seniorityLevel: 'SalesManager'
    },
    {
      name: 'سارة محمود حسن',
      code: 'EMP-002',
      department: 'Sales',
      jobTitle: 'كبير مسؤولي مبيعات',
      email: 'sara.hassan@salesflow.com',
      phone: '01122334455',
      baseSalary: 12000,
      isActive: true,
      hireDate: new Date('2022-06-20'),
      nationalId: '29505051234567',
      target: 3000000,
      seniorityLevel: 'Senior'
    },
    {
      name: 'ياسين إبراهيم',
      code: 'EMP-003',
      department: 'Sales',
      jobTitle: 'مسؤول مبيعات',
      email: 'yassin@salesflow.com',
      phone: '01234567890',
      baseSalary: 8000,
      isActive: true,
      hireDate: new Date('2023-01-10'),
      nationalId: '30001011234567',
      target: 1500000,
      seniorityLevel: 'BC'
    }
  ]);

  // Seed Clients
  const clients = await Client.create([
    {
      name: 'شركة الأمل العقارية',
      email: 'info@alamal.com',
      phone: '0223456789',
      code: 'CLI-001',
      isActive: true
    },
    {
      name: 'محمود عبد العزيز',
      email: 'mahmoud@gmail.com',
      phone: '01099887766',
      code: 'CLI-002',
      isActive: true
    }
  ]);

  // Seed Sales
  await Sale.create([
    {
      saleNumber: 'SALE-1001',
      source: 'Facebook Ads',
      projectName: 'سكاي لاين ريزيدنس',
      clientId: clients[1]._id,
      clientName: clients[1].name,
      unitNumber: 'A-205',
      unitType: 'Apartment',
      unitValue: 2500000,
      contractDate: new Date('2024-04-15'),
      contractCommissionPercentage: 3,
      grossCommissionWithVAT: 75000,
      netRevenue: 65789,
      status: 'confirmed',
      sellers: [
        {
          employeeId: employees[1]._id,
          employeeName: employees[1].name,
          sharePercentage: 100,
          commissionValue: 75000
        }
      ]
    },
    {
      saleNumber: 'SALE-1002',
      source: 'Referral',
      projectName: 'بالم فالي',
      clientId: clients[0]._id,
      clientName: clients[0].name,
      unitNumber: 'V-12',
      unitType: 'Villa',
      unitValue: 8000000,
      contractDate: new Date('2024-05-10'),
      contractCommissionPercentage: 2.5,
      grossCommissionWithVAT: 200000,
      netRevenue: 175438,
      status: 'collected',
      sellers: [
        {
          employeeId: employees[0]._id,
          employeeName: employees[0].name,
          sharePercentage: 50,
          commissionValue: 100000
        },
        {
          employeeId: employees[2]._id,
          employeeName: employees[2].name,
          sharePercentage: 50,
          commissionValue: 100000
        }
      ]
    }
  ]);

  console.log('Database seeded successfully with Arabic data!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
