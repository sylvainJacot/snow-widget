export function isWithinLifetime(config) {
    const now = new Date();
    const start = config.startDate ? new Date(config.startDate.replace('T', ' ') + ':00') : null;
    const end = config.endDate ? new Date(config.endDate.replace('T', ' ') + ':00') : null;

    if (start && end) {
        return now >= start && now <= end;
    } else if (start) {
        return now >= start;
    } else if (end) {
        return now <= end;
    }
    return true; // Pas de restriction
}