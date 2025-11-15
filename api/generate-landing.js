// api/generate-landing.js

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 1) Lire les paramètres de l'URL
    const sujetRaw = (req.query?.sujet || "").toString().trim();
    const keywordRaw = (req.query?.keyword || "").toString().trim();
    const langRaw = (req.query?.lang || "fr").toString().toLowerCase().trim();

    const sujet =
      sujetRaw ||
      (langRaw === "en"
        ? "seaview apartment rental in Roses, Spain directly from owner"
        : "location front de mer à Rosas en direct propriétaire");

    const keyword =
      keywordRaw ||
      (langRaw === "en"
        ? "book seaview apartment Roses Spain"
        : "location front de mer Roses direct propriétaire");

    const isEnglish = langRaw === "en";

    // 2) Prompt en fonction de la langue
    const prompt = isEnglish
      ? `
Write a landing page in English for about 550 words.

Topic: ${sujet}
Main SEO keyword: "${keyword}".

Goal:
- Convince a visitor to book a seaview holiday rental in Roses, Spain, directly with the owner (no commission).
- The page must sound warm, reassuring and human, not like a brochure.

Hard constraints:
- Do not give any dates, prices, numbers, addresses, brand names or exact place names.
- No factual claims that could be checked or refuted (no specific historical facts, no named beaches, no restaurant names, no hotel names, no street names).
- Stay general, impressionistic and narrative.
- The content must be fully fiction-like and impressionistic, not factual.

Structure (HTML):
- Start with a single <h1> using the main idea of the topic.
- Use 3 to 5 sections with <h2>.
- Inside each section, use <p> paragraphs only (no lists).
- Include one block "3 advantages" as a short sequence of 3 <p> paragraphs, each starting with something like "Advantage 1:", "Advantage 2:", "Advantage 3:".
- Include one short "testimonial" block in a <p>, written in first person, as if a guest was happy with their stay (but still without any precise facts).
- Include two CTA paragraphs in <p>:
  - one inviting to "check availabilities for your dates" (for HBook),
  - one inviting to "send a WhatsApp message to ask for a tailored offer".
- Somewhere near the end, add a <p> that reassures with "no commission, direct booking with the owner" and "secure online payment, like with Stripe or similar services".

Style:
- Warm, conversational, empathetic, with soft humour.
- Short to medium-length sentences.
- Smooth transitions between sections.
- No headings like "Introduction" or "Conclusion".

Output:
- Only valid HTML using <h1>, <h2> and <p>.
- No <h3>, no <ul> or <ol>, no inline CSS.
      `.trim()
      : `
Écris une page de destination (landing page) en français d’environ 550 mots.

Sujet : ${sujet}
Mot-clé SEO principal : « ${keyword} ».

Objectif :
- Convaincre un visiteur de réserver une location de vacances en bord de mer à Rosas, en Espagne, directement auprès du propriétaire (sans commission).
- Le ton doit être chaleureux, rassurant et humain, pas une plaquette froide.

Contraintes strictes :
- Ne donne aucune date, aucun prix, aucun chiffre, aucune adresse, aucun nom de marque ni de lieu exact.
- Ne mentionne aucun fait historique précis, aucun nom de plage, aucun nom de restaurant, d’hôtel ou de rue.
- Reste général, impressionniste et narratif.
- Le contenu doit rester entièrement non factuel, basé sur des impressions, des ressentis et des scènes de vie.

Structure (HTML) :
- Commence par un seul <h1> qui reprend l’idée principale de la page.
- Utilise 3 à 5 sections avec des titres en <h2>.
- À l’intérieur des sections, utilise uniquement des paragraphes <p> (pas de listes).
- Intègre un bloc « 3 avantages » sous forme de 3 paragraphes <p> à la suite, chacun commençant par « Avantage 1 : », « Avantage 2 : », « Avantage 3 : ».
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
- Un HTML valide utilisant uniquement <h1>, <h2> et <p>.
- Pas de <h3>, pas de listes <ul> ou <ol>, pas de CSS.
      `.trim();

    // 3) Appel OpenAI
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const content = response.output_text?.trim();
    if (!content) {
      return res.status(500).json({ error: "Aucun texte généré par OpenAI" });
    }

    // 4) Déduire un titre à partir du <h1>
    const h1Match = content.match(/<h1[^>]*>([^<]+)<\\/h1>/i);
    const rawTitle = h1Match ? h1Match[1].trim() : "";
    const title =
      rawTitle || (isEnglish
        ? "Seaview stay in Roses, Spain"
        : "Location front de mer à Rosas");

    // 5) Préparer l'appel à WordPress pour créer une PAGE (et non un article)
    const wpUser = process.env.WP_API_USER;
    const wpPassword = process.env.WP_API_PASSWORD;
    const postsUrl = process.env.WP_API_URL || "";
    // On dérive l'URL des pages à partir de celle des posts
    const pagesUrl = postsUrl.replace("/posts", "/pages");

    const authString = Buffer.from(`${wpUser}:${wpPassword}`).toString("base64");

    const wpResponse = await fetch(pagesUrl, {
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
      console.error("Erreur WordPress (landing):", text);
      return res
        .status(500)
        .json({ error: "Erreur côté WordPress (landing)", details: text });
    }

    const wpPage = await wpResponse.json();

    return res.status(200).json({
      success: true,
      type: "landing",
      lang: isEnglish ? "en" : "fr",
      sujet,
      keyword,
      pageId: wpPage.id,
      link: wpPage.link,
      title: wpPage.title?.rendered,
    });
  } catch (err) {
    console.error("Erreur API generate-landing:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur generate-landing", details: String(err) });
  }
}
