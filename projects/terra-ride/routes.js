export const guides=['Остап Мельник'];
export const routes=[
{id:'forest',name:'Лісова стежка',minutes:60,km:14,level:'Легкий',price:1600,place:'Яремче · урочище Багрівець',desc:'М’яка хвоя під колесами, запах смереки й коротка зупинка біля гірського потоку. Зручний маршрут для першого знайомства з квадроциклом.',gallery:['forest','hero','mountain']},
{id:'mountain',name:'Гірський маршрут',minutes:120,km:32,level:'Середній',price:2800,place:'Яремче · урочище Багрівець',desc:'Кам’яниста дорога виводить із прохолоди лісу на відкритий хребет. На полонині зупинимо двигуни, щоб почути вітер і роздивитися вершини.',gallery:['mountain','expedition','forest']},
{id:'sunset',name:'Захід сонця',minutes:90,km:20,level:'Легкий',price:2200,place:'Яремче · урочище Багрівець',desc:'Неквапливий підйом на оглядову галявину наприкінці дня. На вершині — гарячий чай і час для фотографій у м’якому вечірньому світлі.',gallery:['sunset','mountain','hero']},
{id:'couple',name:'Подорож для двох',minutes:120,km:26,level:'Легкий',price:2400,place:'Яремче · урочище Багрівець',desc:'Поїздка удвох на двомісному квадроциклі через ліс до тихої полонини. На привалі можна помінятися місцями після інструктажу.',gallery:['couple','forest','sunset']},
{id:'expedition',name:'Експедиція вихідного дня',minutes:240,km:52,level:'Складний',price:4600,place:'Яремче · урочище Багрівець',desc:'Довга поїздка для впевнених водіїв. Лісові серпантини, кам’янисті підйоми й обід на полонині складаються в цілий день пригод.',gallery:['expedition','mountain','forest']}
];
export const duration=m=>m===90?'1 год 30 хв':m/60+' год';
export const money=n=>new Intl.NumberFormat('uk-UA').format(n)+' ₴';
export function kyivNow(){let p=Object.fromEntries(new Intl.DateTimeFormat('uk-UA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute}
export function times(r,date,busy=[]){let now=kyivNow();return (r.id==='sunset'?(Number(date.slice(5,7))>=4&&Number(date.slice(5,7))<=9?[16,17,18]:[14,15,16]):[8,9,10,11,12,13,14,15,16,17,18]).filter(h=>h+r.minutes/60<=20).map(h=>{let time=String(h).padStart(2,'0')+':00';return {time,free:date+'T'+time>now&&!busy.some(b=>h*60<b.end&&h*60+r.minutes>b.start)}})}
