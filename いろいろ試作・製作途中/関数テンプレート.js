// Date.now()をJSTに変換する関数
function DatetoJST(timestamp) {
    const date = new Date(timestamp);
    const formatterofJST = new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo', 
    });
    return formatterofJST.format(date).replace(/\//g, '/').replace(/ /g, ' ');
}