/**
 * Для выполнения задания нужно установить Node JS (делается быстро и просто)
 *
 *
 * Дан список городов. Код для их получения в переменную написан. Вам нужно написать программу, которая будет выполняться следующим образом:
 * node ./cities.js "all where %number%>5" - выведет все города из списка с полем number у объектов городов которые соответствуют условию (вместо number могут быть region и city)
 *
 * первое слово указывает максимальное количиство или позицию (Для first и second выводится одна запись) - all - все, first - первый, last - последний, цифра - количество, например
 * node ./cities.js "3 where %number%>5" - выведет в консоль 3 записи
 * node ./cities.js "first where %number%>5" - выведет в консоль первую запись
 *
 * если слова where нет, например:
 * node ./cities.js "all"
 * то вывод работает без фильтрации, в примере выше выведутся в консоль все города.
 * Для удобства разбора (парсинга) строки с запросом рекомендую использовать regex
 * если задан неверный запрос (в примере ниже пропущено слово where но присутствует условие) выводится ошибка: wrong query
 * node ./cities.js "all %number%>5"
 *
 * Операции для запроса могут быть: больше (>), меньше (<), совпадает (=)
 *
 * ОТВЕТ ВЫВОДИТЬ В КОНСОЛЬ И ПИСАТЬ В ФАЙЛ OUTPUT.JSON (каждый раз перезаписывая)
 */

const LIST_OF_CITIES = './cities.json';
const OUTPUT_OF_CITIES = './output.json';

const fs = require('fs');

// Получаем "запрос" из командной строки
const query = process.argv[2];

//Функции-обертки с промисами для вывода и чтения файла
function readFile(file, encoding = 'utf8') {
	return new Promise((resolve, reject) => {
		fs.readFile(file, encoding, (error, data) => {
			error ? reject(error) : resolve(data);
		});
	});
}

function writeFile(data, file = OUTPUT_OF_CITIES, encoding = 'utf8') {
	return new Promise((resolve, reject) => {
		if (data.length !== 0) console.log(data);
		fs.writeFile(file, JSON.stringify(data, null, 2), encoding, (error) => {
			if (error) reject(error);
			resolve(data);
		});
	});
}

//Функция парсинга файла
async function parsingFile(file) {
	return JSON.parse(await readFile(file));
}

// Проверка на правильность вводимых данных
function queryRegexTest(query, cities) {
	const regex = /((^(all|\d+|first|second|last) where %((number%[<>=]\d+$)|((city|region)%=[а-яА-Я .-]+$)))|(^all$))/gim;

	const testRegex = regex.test(query);
	if (testRegex === false) {
		writeFile('Wrong query').then(process.exit(-1));
	} else {
		const queryArray = query.split(' ');
		return {
			queryArray: queryArray,
			cities: cities,
		};
	}
}

function queryCheck(queryArray, cities) {
	//Проверка на множество слов после символа условия
	if (queryArray.length > 3) {
		queryArray[2] +=
			' ' +
			queryArray
				.map((item, index) => {
					if (index > 2) return item;
				})
				.join(' ')
				.trim();
		return queryArray;
	}
	//Проверка на 'all'
	if (queryArray.length === 1) {
		writeFile(cities).then(process.exit(-1));
	} else {
		return queryArray;
	}
}

//Проверка условий, фильтр
function checkConditions(queryArray, cities) {
	const propName = /%[a-zA-Z]+%/gi
		.exec(queryArray[2])
		.join('')
		.slice(0, -1)
		.slice(1);
	const conditionContent = /(\d+$|[а-яА-Я .-]+$)/gi.exec(queryArray[2]).shift();
	const conditionSymbol = /[><=]/gi.exec(queryArray[2]).join('');
	let tempCities = [];

	switch (propName) {
		case 'city':
			tempCities = cities.filter((item) => item.city === conditionContent);
			break;
		case 'region':
			tempCities = cities.filter((item) => item.region === conditionContent);
			break;
		case 'number':
			switch (conditionSymbol) {
				case '<':
					tempCities = cities.filter((item) => +conditionContent > item.number);
					break;
				case '>':
					tempCities = cities.filter((item) => +conditionContent < item.number);
					break;
				case '=':
					tempCities = cities.filter(
						(item) => +conditionContent === item.number
					);
					break;
			}
			break;
	}
	return tempCities;
}

//Парсинг вводимого количества элементов вывода.
function checkQuantity(queryArray, tempCities) {
	const quantity = queryArray[0];
	let updCities = [];

	switch (quantity) {
		case 'all':
			updCities = tempCities;
			console.log(`Доступное количество: ${tempCities.length}`);
			break;
		case 'first':
			updCities = tempCities[0];
			break;
		case 'second':
			updCities = tempCities[1];
			break;
		case 'last':
			updCities = tempCities[tempCities.length - 1];
			break;
		default:
			if (!isNaN(+quantity))
				for (let i = 0; i < +quantity; i++) {
					//Проверка на недоступность элемента(напр. запросил 500, а имеется 39 элементов)
					if (tempCities[i] === undefined) {
						console.log(`Доступное количество: ${i}`);
						break;
					}
					//Вывод доступного количества
					if (i + 1 === +quantity) {
						console.log(`Доступное количество: ${i + 1}`);
					}
					updCities.push(tempCities[i]);
				}
			break;
	}
	return updCities;
}

//Выполнение кода
parsingFile(LIST_OF_CITIES)
	.then((cities) => {
		return queryRegexTest(query, cities);
	})
	.then((data) => {
		const { queryArray, cities } = data;
		const checkedQueryArray = queryCheck(queryArray, cities);
		return { queryArray: checkedQueryArray, cities: cities };
	})
	.then((data) => {
		const { queryArray, cities } = data;
		let tempCities = checkConditions(queryArray, cities);
		let updCities = checkQuantity(queryArray, tempCities);

		return updCities;
	})
	.then((data) => writeFile(data));
