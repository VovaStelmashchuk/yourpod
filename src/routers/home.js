const {getPosts} = require("../core/episodeRepo");

async function podcastListHandler(request, h) {
  const posts = await getPosts();

  const podcastListHtml = posts.map(post => `
        <div class="bg-white p-4 rounded shadow-md">
          <h2 class="text-xl font-bold">${post.title}</h2>
          <p>${post.slug}</p>
        </div>
      `).join('');

  const html = `
        <div id="tab-content" role="tabpanel" class="tab-content grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${podcastListHtml}
        </div>
      `;
  return h.response(html).type('text/html');
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
  server.route({method: 'GET', path: '/tab-podcast-list', handler: podcastListHandler});
  server.route({method: 'GET', path: '/tab-about', handler: aboutHandler});
}


module.exports = home;