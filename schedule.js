var profDetails = document.getElementsByClassName("prof")
var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
const axios = require('axios')
document.getElementById('btn').addEventListener("click", scrape);

function scrape()
{
    for(let i = 0; i<letters.length; i++)
    {
        const url = 'https://ratemyprof-api.vercel.app/api/getProf?first=' + profDetails[0].value + '&last=' + profDetails[1].value + '&schoolCode=U2Nob29sLTE0Nj' + letters[i]
        console.log(url)
        const { data } = axios.get(url);
        try
        {
            if(data['ratings'][i]['class'].includes(profDetails[2].value.toUpperCase()))
            {
                console.log(data['firstName'])
                console.log(data['lastName'])
                console.log(data['avgRating'])
                {break;}
            }
        }
        catch(err){
            
        }
}
}