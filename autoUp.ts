import axios from 'axios';

// https://kita127.hatenablog.com/entry/2023/01/08/000741

const userId = 'kita127';
const blogId = 'kita127.hatenablog.com';
const url = `https://blog.hatena.ne.jp/${userId}/${blogId}/atom/entry`;
const username = 'kita127';
const apiKey = 'sgzt3btztd';

//GET https://blog.hatena.ne.jp/{はてなID}/{ブログID}/atom/entry

//const entryId = '取得する記事のID';
//const apiUrl = `https://blog.hatena.ne.jp/${userId}/${blogId}/atom/entry/${entryId}`;

axios.get(url, {
    headers: {
        'Content-Type': 'application/xml',
    },
    auth: {
        username: username,
        password: apiKey,
    },
}).then(response => {
    const xmlString = response.data;
    console.log(xmlString);
    // const parser = new DOMParser();
    // const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
    // const title = xmlDoc.getElementsByTagName('title')[0].textContent;
    // const content = xmlDoc.getElementsByTagName('content')[0].textContent;
    // console.log(`Title: ${title}`);
    // console.log(`Content: ${content}`);
}).catch(error => {
    console.error(error);
});
