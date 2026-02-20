const Months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

const DaysPerMonth = [
    31,
    28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
];

const DaysPerMonthLeapYear = [
    31,
    29,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
];

const DaysOfTheWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

const DaySuffixes = {
    1: 'st',
    2: 'nd',
    3: 'rd',
    21: 'st',
    22: 'nd',
    23: 'rd',
    31: 'st'
}

const CountryNames = [
    'Gloypland',
    'Frapturnia',
    'Colwslia',
    'Volyvia',
    'Acturt',
    'Boystown',
    'Dunemarch',
    'Ardentia',
    'Hillside',
    'Fropland',
    'Charnia',
    'Upswart',
    'Gungellow',
    'StinkySmellow'
]
CountryNames.sort((a, b) => 0.5 - Math.random());

const Colors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#2D3748', // Dark Blue
    '#63C69C', // Light Blue
    '#C53030', // Dark Red
    '#FFA500', // Light Red
    '#2F855A', // Dark Green
    '#B0E57C', // Light Green
    '#D69E2E', // Dark Yellow
    '#F6E05E', // Light Yellow
    '#FF6347', // Dark Orange
    '#FF8C00', // Light Orange
    '#4FD1C5', // Light Blue Green
    '#3182CE', // Dark Blue Green
    '#FFA500', // Dark Yellow Orange
    '#FF69B4', // Light Pink
    '#68D391', // Dark Green Yellow
    '#6B46C1', // Dark Blue Purple
    '#9F7AEA', // Light Purple
    '#A0522D' // Dark Orange Brown
];
Colors.sort((a, b) => 0.5 - Math.random());

const Terrains = [
    new Terrain('DeepWater', 0, false, 1.5, '#255859'),
    new Terrain('Water', 1, false, 1, '#5f999b'),
    new Terrain('Beach', 2, true, 3, '#f8cd6e'),
    new Terrain('Grass', 3, true, 4, '#899d5e'),
    new Terrain('Hill', 4, true, 3, '#76583f'),
    new Terrain('Mountain', 5, false, 2, '#dddddd'),
];

function findContrastingTextColor(color) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? 'black' : 'white';
}
