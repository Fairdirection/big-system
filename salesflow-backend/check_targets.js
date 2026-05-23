const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backups/database/backup-2026-05-23T13-50-00-107Z-15581bb9/employees.json'));
const teams = JSON.parse(fs.readFileSync('backups/database/backup-2026-05-23T13-50-00-107Z-15581bb9/teams.json'));

const sherif = data.find(e => e.name === 'شريف صبري محمد');
const team = teams.find(t => t.teamLeaderId && t.teamLeaderId['$oid'] === sherif._id['$oid']);
console.log('Sherif target:', sherif.target);

if (team) {
    const memberIds = team.memberIds.map(m => m['$oid']);
    const members = data.filter(e => memberIds.includes(e._id['$oid']));
    console.log('Team Members sum by target property:', members.reduce((sum, m) => sum + m.target, 0));
    members.forEach(m => console.log(m.name, 'target:', m.target, 'managerId:', m.managerId ? m.managerId['$oid'] : null, 'currentTeamId:', m.currentTeamId ? m.currentTeamId['$oid'] : null));
}
