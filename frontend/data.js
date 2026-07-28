(function () {
    const API = 'https://el-atlas-studio.onrender.com/api';
    const cacheKey = 'ea_team_members';

    const readCache = () => {
        try {
            const value = JSON.parse(sessionStorage.getItem(cacheKey) || '[]');
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    };

    const matches = (member, id) =>
        String(member?._id || member?.id || '') === String(id) ||
        String(member?.slug || '') === String(id);

    window.dataManager = {
        getQueryParam(name) {
            return new URLSearchParams(window.location.search).get(name);
        },

        getTeamMember(id) {
            return readCache().find(member => matches(member, id)) || null;
        },

        async fetchTeamAndFind(id) {
            try {
                const response = await fetch(`${API}/team`);
                if (!response.ok) throw new Error(`Team API returned ${response.status}`);
                const payload = await response.json();
                const members = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : []);
                sessionStorage.setItem(cacheKey, JSON.stringify(members));
                return members.find(member => matches(member, id)) || null;
            } catch (error) {
                console.error('Unable to load team member:', error);
                return null;
            }
        }
    };
})();
