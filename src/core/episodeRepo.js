const {Database} = require("./client");


function getPosts() {
  return Database.collection('posts').find({
      'visibility': 'public'
    }, {
      sort: {
        'publish_date': -1
      }
    }
  ).toArray();
}

module.exports = {
  getPosts
}
