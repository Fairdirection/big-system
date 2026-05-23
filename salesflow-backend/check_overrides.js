const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backups/database/backup-2026-05-23T13-50-00-107Z-15581bb9/employees.json'));
const teams = JSON.parse(fs.readFileSync('backups/database/backup-2026-05-23T13-50-00-107Z-15581bb9/teams.json'));
const qt = JSON.parse(fs.readFileSync('backups/database/backup-2026-05-23T13-50-00-107Z-15581bb9/quarterlytargets.json'));

const sherif = data.find(e => e.name === 'شريف صبري محمد');
const team = teams.find(t => t.teamLeaderId && t.teamLeaderId['$oid'] === sherif._id['$oid']);

if (team) {
    const memberIds = team.memberIds.map(m => m['$oid']);
    const members = data.filter(e => memberIds.includes(e._id['$oid']));
    let overrideSum = 0;
    members.forEach(m => {
        const override = qt.find(q => q.employeeId && q.employeeId['$oid'] === m._id['$oid']);
        console.log(m.name, 'target:', m.target, 'override:', override ? override.target : null);
        overrideSum += override ? override.target : m.target;
    });
    console.log('Total with overrides:', overrideSum);
}
