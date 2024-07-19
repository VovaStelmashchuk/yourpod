const {getPosts} = require("../core/episodeRepo");

async function podcastListHandler(request, h) {
  const posts = await getPosts();

  const podcastListHtml = posts.map(post => {
    // Condition to determine if the image should be blurred
    const blurClass = post.type === 'patreon' ? 'filter blur-md' : '';
    const podcastDescription = post.charters ? post.charters.map(charter => charter.description).join(' ') : '';

    const badgeHtml = post.type === 'patreon' ? `
        <div class="absolute inset-0 flex justify-center items-center">
            <span class="inline-flex bg-red-600 text-white text-xl font-semibold px-6 py-4 rounded-full">Patreon Special</span>
        </div>` : '';

    return `
        <div class="bg-white p-4 rounded shadow-md">
                    <div class="relative w-full h-48">
            <img src="https://androidstory.dev/files/logo.jpg" alt="Android story logo" class="w-full h-full object-cover rounded-t-md ${blurClass}">
            ${badgeHtml}
          </div>
          <h2 class="text-xl font-bold mt-4 line-clamp-3">${post.title}</h2>
          <p class="line-clamp-6">${podcastDescription}</p>
        </div>
      `;
  }).join('');

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