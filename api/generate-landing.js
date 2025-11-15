// api/generate-landing.js
// Génère une "landing" optimisée SEO + conversion, publiée comme ARTICLE WordPress.

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 1) Lire les paramètres de l'URL
    const sujetRaw = (req.query && req.query.sujet ? req.query.sujet : "").toString().trim();
    const keywordRaw = (req.query && req.query.keyword ? req.query.keyword : "").toString().trim();
    const langRaw = (req.query && req.query.lang ? req.query.lang : "fr").toString().toLowerCase().trim();

    const isEnglish = langRaw === "en";

    const sujet = sujetRaw || (
      isEnglish
        ? "seaview apartment rental in Roses, Spain directly from owner"
        : "location front de mer à Rosas en direct propriétaire"
    );

    const keyword = keywordRaw || (
      isEnglish
        ? "book seaview apartment Roses Spain"
        : "location front de mer Roses direct propriétaire"
    );

    // 2) Prompt en fonction de la langue (version simple, robuste)
    const prompt = isEnglish
      ? `
Write a landing page in English of about 550 words.

Topic: ${sujet}
Main SEO keyword: "${keyword}".

Goal:
- Convince a visitor to book a seaview holiday rental in Roses, Spain, directly with the owner (no commission).
- Warm, reassuring, human tone, not like a brochure.

Hard constraints:
- No dates, prices, numbers, addresses, brand names or exact place names.
- No precise historical facts, no named beaches, no restaurant or hotel names, no street names.
- Stay general, impressionistic and narrative.
- The content must be non-factual, based on impressions and feelings.

Structure (HTML inside the content):
- Start with a title-like sentence that can be used as <h1> at the beginning.
- Then use several subtitles that can be used as <h2>.
- Use only paragraphs <p> for the text (no lists).
- Include one block "3 advantages" as three consecutive <p> paragraphs starting with "Advantage 1:", "Advantage 2:", "Advantage 3:".
- Include one short "testimonial" block in a <p>, written in first person, as if a happy guest was speaking (but with no precise facts).
- Include two call-to-action paragraphs <p>:
  - one inviting to "check availabilities for your dates" (for HBook),
  - one inviting to "send a WhatsApp message to ask for a tailored offer".
- Near the end, add a <p> that reassures with "no commission, direct booking with the owner" and "secure online payment, like with Stripe or similar services".

Style:
- Warm, conversational, a bit playful.
- Short to medium sentences.
- Smooth transitions.
- No headings like "Introduction" or "Conclusion".

Output:
- A coherent HTML-like text using <h1> for the main title, <h2> for subtitles and <p> for paragraphs.
      `.trim()
      : `
Écris une page de destination (landing page) en français d’environ 550 mots.

Sujet : ${sujet}
Mot-clé SEO principal : « ${keyword} ».

Objectif :
- Convaincre un visiteur de réserver une location de vacances en bord de mer à Rosas, en Espagne, directement auprès du propriétaire (sans commission).
- Ton chaleureux, rassurant et humain, pas une plaquette froide.

Contraintes strictes :
- Ne donne aucune date, aucun prix, aucun chiffre, aucune adresse, aucun nom de marque ni de lieu exact.
- Ne mentionne aucun fait historique précis, aucun nom de plage, aucun nom de restaurant, d’hôtel ou de rue.
- Reste général, impressionniste et narratif.
- Le contenu doit rester entièrement non factuel, basé sur des impressions et des ressentis.

Structure (HTML dans le contenu) :
- Commence par une phrase de titre qui pourra servir de <h1>.
- Utilise ensuite plusieurs sous-titres qui pourront servir de <h2>.
- Utilise uniquement des paragraphes <p> pour le texte (pas de listes).
- Intègre un bloc « 3 avantages » sous forme de 3 paragraphes <p> consécutifs, commençant par « Avantage 1 : », « Avantage 2 : », « Avantage 3 : ».
- Intègre un court bloc « témoignage » dans un <p>, écrit à la première personne, comme si un vacancier satisfait racontait son séjour (sans élément factuel précis).
- Ajoute deux paragraphes d’appel à l’action (CTA) en <p> :
  - l’un qui invite le lecteur à « voir les disponibilités pour ses dates » (pour HBook),
  - l’autre qui invite à « envoyer un message WhatsApp pour demander une offre personnalisée ».
- Vers la fin de la page, ajoute un <p> qui rassure en mentionnant « sans commission, réservation en direct avec le propriétaire » et « paiement en ligne sécurisé, comme avec Stripe ou un service équivalent ».

Style :
- Ton chaleureux, conversationnel, avec une pointe d’humour.
- Phrases courtes à moyennes.
- Transitions fluides entre les sections.
- Pas de titres « Introduction » ou « Conclusion ».

Sortie attendue :
- Un texte cohérent, utilisable tel quel dans WordPress, avec <h1>, <h2> et <p>.
      `.trim();

    // 3) Appel OpenAI
    const aiResponse = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const content = aiResponse.output_text ? aiResponse.output_text.trim() : "";
    if (!content) {
      return res.status(500).json({ error: "Aucun texte généré par OpenAI" });
    }

    // 4) Extraire un titre à partir du premier <h1> ou de la première ligne
    let title = "";
    const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      title = h1Match[1].trim();
    } else {
      // fallback : première ligne texte
      const firstLine = content.split("\n").find((l) => l.trim().length > 0) || "";
      title = firstLine.trim().slice(0, 80) || (isEnglish
        ? "Seaview stay in Roses, Spain"
        : "Location front de mer à Rosas");
    }

    // 5) Appel WordPress : on publie comme ARTICLE (posts) pour rester simple
    const wpUser = process.env.WP_API_USER;
    const wpPassword = process.env.WP_API_PASSWORD;
    const wpPostsUrl = process.env.WP_API_URL; // doit déjà pointer vers /wp-json/wp/v2/posts

    if (!wpUser || !wpPassword || !wpPostsUrl) {
      return res.status(500).json({ error: "Config WordPress manquante (env vars)" });
    }

    const authString = Buffer.from(`${wpUser}:${wpPassword}`).toString("base64");

    const wpResponse = await fetch(wpPostsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        title,
        content,
        status: "publish",
      }),
    });

    if (!wpResponse.ok) {
      const text = await wpResponse.text();
      console.error("Erreur WordPress (generate-landing):", text);
      return res
        .status(500)
        .json({ error: "Erreur côté WordPress (generate-landing)", details: text });
    }

    const wpPost = await wpResponse.json();

    return res.status(200).json({
      success: true,
      type: "landing-post",
      lang: isEnglish ? "en" : "fr",
      sujet,
      keyword,
      postId: wpPost.id,
      link: wpPost.link,
      title: wpPost.title && wpPost.title.rendered ? wpPost.title.rendered : title,
    });
  } catch (err) {
    console.error("Erreur API generate-landing:", err);
    return res.status(500).json({
      error: "Erreur serveur generate-landing",
      details: String(err),
    });
  }
}
