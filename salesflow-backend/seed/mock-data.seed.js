const mongoose = require('mongoose');
const Team = require('../src/models/team.model');
const Employee = require('../src/models/employee.model');
const Client = require('../src/models/client.model');
const Sale = require('../src/models/sale.model');
const Claim = require('../src/models/claim.model');
const Setting = require('../src/models/setting.model');

const seedMockData = async () => {
  try {
    console.log('Starting mock data seeding...');

    // 1. Clear existing data
    await Promise.all([
      Team.deleteMany({}),
      Employee.deleteMany({}),
      Client.deleteMany({}),
      Sale.deleteMany({}),
      Claim.deleteMany({})
    ]);

    // 2. Create Top Management / Managers
    const manager1 = await Employee.create({
      code: 'EMP-0001',
      name: 'أدهم محمد',
      nationalId: '12345678901234',
      department: 'TopManagement',
      jobTitle: 'المدير التنفيذي',
      seniorityLevel: 'SalesManager',
      hireDate: new Date('2024-01-01'),
      managerId: new mongoose.Types.ObjectId(), // Self or system
      email: 'adham@salesflow.com',
      phone: '01112223334'
    });

    // 3. Create Teams and Leaders
    const leaders = await Promise.all([
      Employee.create({
        code: 'EMP-1001',
        name: 'سارة أحمد',
        nationalId: '22345678901234',
        department: 'Sales',
        jobTitle: 'قائد فريق مبيعات',
        seniorityLevel: 'TeamLeader',
        hireDate: new Date('2024-02-01'),
        managerId: manager1._id,
        email: 'sarah@salesflow.com',
        phone: '01223334445',
        target: 1500000
      }),
      Employee.create({
        code: 'EMP-1002',
        name: 'ياسين محمود',
        nationalId: '32345678901234',
        department: 'Sales',
        jobTitle: 'قائد فريق مبيعات',
        seniorityLevel: 'TeamLeader',
        hireDate: new Date('2024-02-15'),
        managerId: manager1._id,
        email: 'yassin@salesflow.com',
        phone: '01005556667',
        target: 1800000
      })
    ]);

    const teams = await Promise.all([
      Team.create({
        name: 'فريق النخبة',
        teamLeaderId: leaders[0]._id,
        memberIds: [leaders[0]._id]
      }),
      Team.create({
        name: 'فريق الصقور',
        teamLeaderId: leaders[1]._id,
        memberIds: [leaders[1]._id]
      })
    ]);

    // 4. Create Sales Employees
    const sellers = await Promise.all([
      Employee.create({
        code: 'EMP-2001',
        name: 'محمد علي',
        nationalId: '42345678901234',
        department: 'Sales',
        jobTitle: 'استشاري مبيعات',
        seniorityLevel: 'BC',
        hireDate: new Date('2024-03-01'),
        managerId: leaders[0]._id,
        currentTeamId: teams[0]._id,
        email: 'mohamed.ali@salesflow.com',
        phone: '01556667778',
        target: 800000
      }),
      Employee.create({
        code: 'EMP-2002',
        name: 'ليلى حسن',
        nationalId: '52345678901234',
        department: 'Sales',
        jobTitle: 'سينيور مبيعات',
        seniorityLevel: 'Senior',
        hireDate: new Date('2024-03-05'),
        managerId: leaders[0]._id,
        currentTeamId: teams[0]._id,
        email: 'layla.hassan@salesflow.com',
        phone: '01114445556',
        target: 1000000
      }),
      Employee.create({
        code: 'EMP-2003',
        name: 'يوسف عمر',
        nationalId: '62345678901234',
        department: 'Sales',
        jobTitle: 'مسؤول مبيعات',
        seniorityLevel: 'BA',
        hireDate: new Date('2024-03-10'),
        managerId: leaders[1]._id,
        currentTeamId: teams[1]._id,
        email: 'youssef.omar@salesflow.com',
        phone: '01227778889',
        target: 600000
      }),
      Employee.create({
        code: 'EMP-2004',
        name: 'نورا كمال',
        nationalId: '72345678901234',
        department: 'Sales',
        jobTitle: 'مسؤول مبيعات مبتدئ',
        seniorityLevel: 'Fresh',
        hireDate: new Date('2024-04-01'),
        managerId: leaders[1]._id,
        currentTeamId: teams[1]._id,
        email: 'noura.kamal@salesflow.com',
        phone: '01009990001',
        target: 400000
      })
    ]);

    // Update Team Member IDs
    await Promise.all([
      Team.findByIdAndUpdate(teams[0]._id, { $push: { memberIds: { $each: [sellers[0]._id, sellers[1]._id] } } }),
      Team.findByIdAndUpdate(teams[1]._id, { $push: { memberIds: { $each: [sellers[2]._id, sellers[3]._id] } } })
    ]);

    // 5. Create Clients
    const clients = await Promise.all([
      Client.create({ code: 'CLT-001', name: 'شركة النور للتطوير', phone: '0223456789', email: 'info@alnoor.com' }),
      Client.create({ code: 'CLT-002', name: 'مجموعة الفطيم', phone: '0223456790', email: 'contact@alfuttaim.com' }),
      Client.create({ code: 'CLT-003', name: 'شركة المقاولون العرب', phone: '0223456791', email: 'hq@arab-contractors.com' }),
      Client.create({ code: 'CLT-004', name: 'إعمار مصر', phone: '0223456792', email: 'sales@emaar.com' }),
      Client.create({ code: 'CLT-005', name: 'طلعت مصطفى', phone: '0223456793', email: 'info@tmg.com.eg' })
    ]);

    // 6. Create Sales
    const saleSources = await Setting.find({ type: 'saleSource' });
    
    const sales = await Promise.all([
      Sale.create({
        saleNumber: 'SALE-2024-001',
        clientId: clients[0]._id,
        clientName: clients[0].name,
        projectName: 'كمبوند سكاي لاين',
        unitNumber: 'A-101',
        unitType: 'شقة 3 غرف',
        unitValue: 3500000,
        contractDate: new Date('2024-04-01'),
        source: saleSources[0]?.value || 'Private',
        developerCollectionPercentage: 100,
        contractCommissionPercentage: 3.5,
        invoiceStatus: 'Not Issued',
        sellers: [
          { employeeId: sellers[0]._id, sharePercentage: 70 },
          { employeeId: leaders[0]._id, sharePercentage: 30 }
        ],
        status: 'confirmed',
        quarterId: 'Q2-2024'
      }),
      Sale.create({
        saleNumber: 'SALE-2024-002',
        clientId: clients[1]._id,
        clientName: clients[1].name,
        projectName: 'فيلات ماونتن فيو',
        unitNumber: 'V-05',
        unitType: 'فيلا مستقلة',
        unitValue: 12000000,
        contractDate: new Date('2024-04-10'),
        source: saleSources[1]?.value || 'Website',
        developerCollectionPercentage: 50,
        contractCommissionPercentage: 4.0,
        invoiceStatus: 'Not Issued',
        sellers: [
          { employeeId: sellers[1]._id, sharePercentage: 100 }
        ],
        status: 'confirmed',
        quarterId: 'Q2-2024'
      }),
      Sale.create({
        saleNumber: 'SALE-2024-003',
        clientId: clients[2]._id,
        clientName: clients[2].name,
        projectName: 'بارك لين ريزيدنس',
        unitNumber: 'G-12',
        unitType: 'تاون هاوس',
        unitValue: 5200000,
        contractDate: new Date('2024-04-15'),
        source: saleSources[2]?.value || 'Referral',
        developerCollectionPercentage: 100,
        contractCommissionPercentage: 2.5,
        invoiceStatus: 'Not Issued',
        sellers: [
          { employeeId: sellers[2]._id, sharePercentage: 100 }
        ],
        status: 'confirmed',
        quarterId: 'Q2-2024'
      })
    ]);

    // 7. Create Claims
    await Promise.all([
      Claim.create({
        claimNumber: 'CLM-001',
        saleId: sales[0]._id,
        saleNumber: sales[0].saleNumber,
        projectName: sales[0].projectName,
        unitNumber: sales[0].unitNumber,
        clientName: sales[0].clientName,
        commissionDue: 122500,
        status: 'pending'
      }),
      Claim.create({
        claimNumber: 'CLM-002',
        saleId: sales[1]._id,
        saleNumber: sales[1].saleNumber,
        projectName: sales[1].projectName,
        unitNumber: sales[1].unitNumber,
        clientName: sales[1].clientName,
        commissionDue: 240000,
        status: 'collected',
        collectedAmount: 240000,
        collectionDate: new Date('2024-05-10')
      })
    ]);

    console.log('Arabic mock data seeding complete');
  } catch (error) {
    console.error('Error seeding mock data:', error);
    throw error;
  }
};

module.exports = seedMockData;
