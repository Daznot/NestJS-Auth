export function convertToSecondUtil(timeStr: string) {
    if (!isNaN(timeStr as any)) {
        return parseInt(timeStr);
    }

    let miltiplier;

    switch (timeStr[timeStr.length - 1]) {
        case 's':
            miltiplier = 1;
            break;
        case 'm':
            miltiplier = 60;
            break;
        case 'h':
            miltiplier = 60 * 60;
            break;
        case 'd':
            miltiplier = 24 * 60 * 60;
            break;
        case 'M':
            miltiplier = 30 * 24 * 60 * 60;
            break;
        case 'y':
            miltiplier = 365 * 30 * 24 * 60 * 60;
            break;
        default:
            throw new Error('Invalid time string');
    }

    const num = parseInt(timeStr.slice(0, -1));
    return num * miltiplier;
}
