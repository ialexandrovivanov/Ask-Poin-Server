const generate = function() {
    let password = '';
    for (let index = 0; index < 10; index++) { password = password + (Math.floor(Math.random() * 10)).toString(); }
    return password;
}

module.exports = generate;
