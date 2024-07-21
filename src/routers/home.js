const {getPosts} = require("../core/episodeRepo");

async function homeHandler(request, h) {
  return h.view('home', {}, {layout: 'layout'});
}

async function podcastListHandler(request, h) {
  const posts = await getPosts();
  const postsWithChartersDescription = posts.map(post => ({
    ...post,
    chartersDescription: post.charters ? post.charters.map(charter => charter.description).join(' ') : '',
    url: post.type === 'public' ? `/podcast/${post.slug}` : 'https://www.patreon.com/androidstory',
  }));

  return h.view('podcastList', {
      posts: postsWithChartersDescription,
    }, {
      layout: false
    }
  );
}

function aboutHandler(request, h) {
  const html = `
        <div id="tab-content" role="tabpanel" class="tab-content">
            <p class="text-xl">Двa андроїдщики, два Вови і деколи дві різні думки. Кожний подкаст ми обговорюємо нові релізи в світі android розробки, кращі і не дуже практики. Ділимося своїми думками, досвідом і деколи пробуємо не смішно жатрувати. Також тут ви знайдете рекомендації початківцям, а хто давно в розробці мають тут просто гарно провести час.</p>
        </div>
      `;
  return h.response(html).type('text/html');
}


function home(server) {
  server.route({method: 'GET', path: '/', handler: homeHandler});
  server.route({method: 'GET', path: '/tab-podcast-list', handler: podcastListHandler});
  server.route({method: 'GET', path: '/tab-about', handler: aboutHandler});
}


module.exports = {
  home
};