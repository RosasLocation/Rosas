// api/generate-landing.js
// Génère une "landing" optimisée SEO + conversion, publiée comme ARTICLE WordPress.

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 1) Lire les paramètres de l'URL
    const sujetRaw = (req.query && req.query.sujet ? req.query.sujet : "")
      .toString()
      .trim();
    const keywordRaw = (req.query && req.query.keyword ? req.query.keyword : "")
      .toString()
      .trim();
    const langRaw = (req.query && req.query.lang ? req.query.lang : "fr")
      .toString()
      .toLowerCase()
      .trim();

    const isEnglish = langRaw === "en";

    const sujet =
      sujetRaw ||
      (isEnglish
        ? "seaview apartment rental in Roses, Spain directly from owner"
        : "location front de mer à Rosas en direct propriétaire");

    const keyword =
      keywordRaw ||
      (isEnglish
        ? "book seaview apartment Roses Spain"
        : "location front de mer Roses direct propriétaire");

    // 2) Prompt en fonction de la langue (style premium rassurant + META SEO auto)
    const prompt = isEnglish
      ? `
Write a landing page in English of about 550 words.

Topic: ${sujet}
Main transactional keyword: "${keyword}".

Tone and style:
- Warm, soft, premium, human.
- Calm, elegant, reassuring, like a thoughtful and welcoming host.
- Gentle sensory details (light, air, atmosphere), without exaggeration.
- Clear, simple, direct language, no corporate tone, no sales pressure.

Goal:
- Make the reader feel the peaceful experience of staying in Roses.
- Build trust as a direct-owner host (no commission, direct booking).
- Encourage booking, but in a calm and reassuring way.
- Highlight the benefits: sea view, simplicity, comfort, direct contact.

Hard constraints:
- No dates, no prices, no numbers at all.
- No addresses, no brand names, no exact place names.
- No historical facts, no named beaches, no restaurant or hotel names, no streets.
- No verifiable external facts about real-world entities.
- The text must remain impressionistic, narrative, and non-factual.

Required HTML structure:
- Start with a <meta-title> tag that contains the main keyword once and a soft benefit. Length: max ~60 characters.
- Add a <meta-description> tag (under 150 characters), warm and natural, containing the keyword exactly once, without keyword stuffing.
- Then a single <h1> that can be used as the main title, containing the keyword in a natural way.
- Use several <h2> subtitles to structure the page (2 to 4).
- Use only <p> for paragraphs (no lists).
- Include one "3 advantages" block as three consecutive <p> paragraphs starting with:
    "Advantage 1:",
    "Advantage 2:",
    "Advantage 3:".
- Include one short "testimonial" block in a <p>, written in first person, as if a happy guest was speaking (but with no precise facts or names).
- Include two call-to-action paragraphs <p>:
    1) One inviting the reader to check availabilities for their dates, with a clickable link to https://www.location-rosas.fr/en/booking/ and optionally a mention of https://www.location-rosas.fr/en/rates/
    2) One inviting the reader to send a WhatsApp message to ask for a tailored offer, with a clickable link to:
       https://api.whatsapp.com/send/?phone=33632470724&text=Hello%2C+I%20would%20like%20to%20book%20a%20stay%20in%20Roses&type=phone_number&app_absent=0
- Near the end, add a <p> that reassures with these ideas:
    "direct booking with the owner",
    "no commission",
    "secure online payment, like Stripe or similar services".

Output:
- Clean HTML-like text that includes exactly these tags: <meta-title>, <meta-description>, <h1>, <h2>, <p>.
- No other tags (no <ul>, <ol>, <strong>, etc.).
- The whole text must feel premium, human, soft and trustworthy.
      `.trim()
      : `
Écris une page de destination (landing page) en français d’environ 550 mots.

Sujet : ${sujet}
Mot-clé principal (transactionnel) : « ${keyword} ».

Ton et style :
- ton chaleureux, apaisant, premium, simple et humain.
- style clair, fluide, avec quelques détails sensoriels (lumière, air, ambiance).
- voix de propriétaire bienveillant qui accueille sans pression.
- pas de ton plaquette, pas de jargon marketing, pas de lyrisme excessif.

Objectif :
- faire ressentir la tranquillité d’un séjour à Rosas.
- rassurer le lecteur comme si un hôte direct lui parlait.
- donner envie de réserver en direct, sans commission.
- mettre en avant la vue mer, le confort, la simplicité de la réservation.

Contraintes strictes :
- ne donne aucune date, aucun prix, aucun chiffre.
- ne mentionne aucune adresse, aucune marque, aucun lieu exact (ni nom de quartier, ni nom de plage, ni nom de restaurant, ni nom d’hôtel).
- ne donne aucun fait historique, aucun élément vérifiable.
- ne parle pas de services précis identifiables dans la réalité.
- reste général, impressionniste et narratif, pas factuel.

Structure HTML attendue :
- commence par une balise <meta-title> qui contient le mot-clé principal une seule fois, avec un bénéfice clair, en moins de 60 caractères.
- ajoute ensuite une balise <meta-description> (moins de 150 caractères), ton chaleureux, naturel, contenant une seule fois le mot-clé, sans sur-optimisation.
- puis un seul <h1> qui servira de titre principal, intégrant le mot-clé naturellement.
- utilise ensuite 2 à 4 sous-titres <h2> pour structurer la page.
- utilise uniquement des paragraphes <p> pour le texte (pas de listes, pas d’autres balises).

Contenu spécifique :
- intègre un bloc « 3 avantages » sous forme de 3 paragraphes <p> consécutifs, commençant par :
    « Avantage 1 : »,
    « Avantage 2 : »,
    « Avantage 3 : ».
- intègre un court bloc « témoignage » dans un <p>, à la première personne, comme si un vacancier satisfait racontait son ressenti (sans détail vérifiable).
- ajoute deux paragraphes d’appel à l’action (CTA) en <p> :
    1) l’un qui invite le lecteur à voir les disponibilités pour ses dates, avec un lien cliquable vers https://www.location-rosas.fr/reserver/ et, éventuellement, une mention de https://www.location-rosas.fr/tarifs/
    2) l’autre qui invite le lecteur à envoyer un message WhatsApp pour demander une offre personnalisée, avec un lien cliquable vers :
       https://api.whatsapp.com/send/?phone=33632470724&text=Bonjour%2C+je+souhaite+r%C3%A9server+un+s%C3%A9jour+%C3%A0+Rosas&type=phone_number&app_absent=0
- vers la fin de la page, ajoute un <p> qui rassure en mentionnant clairement :
    « sans commission », 
    « réservation en direct avec le propriétaire », 
    « paiement en ligne sécurisé, comme avec Stripe ou un service équivalent ».

Style global :
- phrases courtes à moyennes.
- transitions douces entre les idées.
- ton posé, rassurant, jamais agressif.
- pas de titres “Introduction” ou “Conclusion”.

Sortie attendue :
- un texte cohérent, prêt à être utilisé tel quel dans WordPress, contenant uniquement les balises <meta-title>, <meta-description>, <h1>, <h2> et <p>.
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
      const firstLine =
        content.split("\n").find((l) => l.trim().length > 0) || "";
      title =
        firstLine.trim().slice(0, 80) ||
        (isEnglish
          ? "Seaview stay in Roses, Spain"
          : "Location front de mer à Rosas");
    }

    // 5) Appel WordPress : on publie comme ARTICLE (posts) pour rester simple
    const wpUser = process.env.WP_API_USER;
    const wpPassword = process.env.WP_API_PASSWORD;
    const wpPostsUrl = process.env.WP_API_URL; // doit déjà pointer vers /wp-json/wp/v2/posts

    if (!wpUser || !wpPassword || !wpPostsUrl) {
      return res
        .status(500)
        .json({ error: "Config WordPress manquante (env vars)" });
    }

    const authString = Buffer.from(`${wpUser}:${wpPassword}`).toString(
      "base64"
    );

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
      return res.status(500).json({
        error: "Erreur côté WordPress (generate-landing)",
        details: text,
      });
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
      title:
        wpPost.title && wpPost.title.rendered
          ? wpPost.title.rendered
          : title,
    });
  } catch (err) {
    console.error("Erreur API generate-landing:", err);
    return res.status(500).json({
      error: "Erreur serveur generate-landing",
      details: String(err),
    });
  }
}
