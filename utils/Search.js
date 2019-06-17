import Rental from '../ethereum/rental';
async function getSumMatching(filterArray, rent){
    let i, j;
    const summary =await Rental(rent).methods.getSummary().call();

    //let arraySum = summary[0].concat(" ",(await getString('Qm'+summary[1]))).toLowerCase().split(" ");
    let arraySum = summary[0].toLowerCase().split(" ");
    console.log(arraySum);
    let  occurences = 0;
    for (i=0;i<filterArray.length;i++){
        for (j=0;j<arraySum.length;j++){
            if (filterArray[i]===arraySum[j]) occurences++;
        }
    }
    console.log(occurences);
    return occurences;
}

async function search(value, rents){
    console.log('Hello');
    let array = value.toLowerCase().split(" ");
    let i;
    let filterArray = [];
    for (i=0;i<array.length;i++){
        if (array[i]!='') filterArray.push(array[i]);
    } 

    let arrayOccurrences = [];
    for (i=0;i<rents.length;i++){
        arrayOccurrences.push([await getSumMatching(filterArray,rents[i]),rents[i]]);
    }

    console.log(arrayOccurrences);

    arrayOccurrences.sort((a,b)=>{return (b[0]-a[0])});
    console.log('This is', value);
    if (arrayOccurrences[0][0] == 0) return [];
    let result = [];
    let limit = 10;
    for (i=0;i<limit;i++){
        if (arrayOccurrences[i][0]==0) break;
        result.push(arrayOccurrences[i][1]);
    }
    return result;
}
export {getSumMatching,search};
