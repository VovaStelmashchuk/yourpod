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

function getPostBySlug(slug) {
  return Database.collection('posts').findOne({slug: slug});
}

module.exports = {
  getPosts,
  getPostBySlug
}
