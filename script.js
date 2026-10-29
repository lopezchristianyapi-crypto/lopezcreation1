const NUMERO_WHATSAPP_RESTAURANT = "2250173311229"; // Numéro WhatsApp configuré pour le projet

let panier = [];

// Détection automatique du Mercredi (3) et Samedi (6)
function estJourReduction() {
    const jourSemaine = new Date().getDay();
    return jourSemaine === 3 || jourSemaine === 6;
}

// Initialisation au chargement de la page
window.onload = function() {
    if (estJourReduction()) {
        document.getElementById('banner-promo').style.display = 'block';
        document.getElementById('welcome-promo-tag').style.display = 'block';
    }
};

// Fonction pour fermer immédiatement le message de bienvenue
function fermerBienvenue() {
    const modal = document.getElementById('welcome-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Ajouter un article au panier
function ajouterAuPanier(nom, prix) {
    const index = panier.findIndex(item => item.nom === nom);
    if (index !== -1) {
        panier[index].quantite += 1;
    } else {
        panier.push({ nom: nom, prix: prix, quantite: 1 });
    }
    afficherPanier();
}

// Supprimer un article du panier
function supprimerDuPanier(index) {
    panier.splice(index, 1);
    afficherPanier();
}

// Mettre à jour l'affichage du panier et calculer le total
function afficherPanier() {
    const tbody = document.getElementById("liste-panier-body");
    tbody.innerHTML = "";

    if (panier.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #777;">Votre panier est vide. Cliquez sur un plat ou une boisson ci-dessus pour l'ajouter.</td></tr>`;
        document.getElementById('afficher-total').textContent = "0";
        document.getElementById('mention-reduction').style.display = 'none';
        return;
    }

    let sousTotalGlobal = 0;

    panier.forEach((item, index) => {
        const totalArticle = item.prix * item.quantite;
        sousTotalGlobal += totalArticle;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.nom}</strong></td>
            <td>${item.prix} FCFA</td>
            <td>${item.quantite}</td>
            <td>${totalArticle} FCFA</td>
            <td><button class="btn-supprimer" onclick="supprimerDuPanier(${index})">❌</button></td>
        `;
        tbody.appendChild(tr);
    });

    let totalFinal = sousTotalGlobal;
    const mention = document.getElementById('mention-reduction');

    if (estJourReduction()) {
        totalFinal = sousTotalGlobal * 0.90; // 10% de réduction
        mention.style.display = 'block';
    } else {
        mention.style.display = 'none';
    }

    document.getElementById('afficher-total').textContent = Math.round(totalFinal);
}

// Choix du mode de paiement
function selectionnerPaiement(element, nom) {
    document.querySelectorAll('.paiement-card').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('paiement-selectionne').value = nom;

    const qrBox = document.getElementById('carte-qr-box');
    if (nom === 'Wave') {
        qrBox.style.display = 'block';
    } else {
        qrBox.style.display = 'none';
    }
}

// Validation de la commande (sans message de confirmation visuel sur le site)
function validerCommande(event) {
    event.preventDefault();

    if (panier.length === 0) {
        alert("Votre panier est vide ! Veuillez ajouter au moins un plat ou une boisson.");
        return;
    }

    const nom = document.getElementById('client-nom').value;
    const phone = document.getElementById('client-phone').value;
    const lieu = document.getElementById('client-lieu').value;
    const total = document.getElementById('afficher-total').textContent;
    const paiement = document.getElementById('paiement-selectionne').value;
    const veutSAbonner = document.getElementById('abonner-promo').checked;

    if (!paiement) {
        alert("Veuillez choisir un mode de paiement !");
        return;
    }

    // Sauvegarde de l'abonné dans LocalStorage
    if (veutSAbonner) {
        sauvegarderAbonne(nom, phone);
    }

    // Préparation du détail des articles pour WhatsApp
    let resumeArticlesTexte = panier.map(item => `• ${item.quantite}x ${item.nom} (${item.prix * item.quantite} FCFA)`).join("\n");

    // --- CONSTRUCTION DU MESSAGE WHATSAPP ---
    let message = `Bonjour AYA Resto (Aya Resto) ! 👋\n\n`; // 1. Salutations
    message += `Je m'appelle *${nom}* et je souhaite passer une commande.\n\n`; // 2. Présentation
    message += `📍 *Localisation précise pour la livraison :*\n${lieu}\n\n`; // 3. Localisation précise
    message += `🍲 *Détails de ma commande :*\n${resumeArticlesTexte}\n\n`;
    message += `💳 *Mode de paiement choisi :* ${paiement}\n\n`;
    message += `Merci beaucoup pour le service ! 🙏\n`; // 4. Remerciement
    message += `💰 *Net à payer :* ${total} FCFA`; // Net à payer

    // Redirection directe vers WhatsApp sans afficher de message sur le site
    const url = `https://wa.me/${NUMERO_WHATSAPP_RESTAURANT}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}
  
// Enregistrement des abonnés
function sauvegarderAbonne(nom, telephone) {
    let list = JSON.parse(localStorage.getItem("lopez_resto_abonnes")) || [];
    const existe = list.some(a => a.telephone === telephone);
    if (!existe) {
        list.push({ nom: nom, telephone: telephone, date: new Date().toLocaleDateString() });
        localStorage.setItem("lopez_resto_abonnes", JSON.stringify(list));
    }
}

// Fonctions Panneau Admin
function toggleAdminPanel() {
    const p = document.getElementById("admin-panel");
    if (p.style.display === "none" || p.style.display === "") {
        chargerListeAbonnes();
        p.style.display = "block";
    } else {
        p.style.display = "none";
    }
}

function chargerListeAbonnes() {
    const list = JSON.parse(localStorage.getItem("lopez_resto_abonnes")) || [];
    const tbody = document.getElementById("liste-abonnes-body");
    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Aucun abonné enregistré.</td></tr>`;
        return;
    }

    list.forEach(a => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${a.nom}</td><td><strong>${a.telephone}</strong></td><td>${a.date}</td>`;
        tbody.appendChild(tr);
    });
}

function exporterAbonnes() {
    const list = JSON.parse(localStorage.getItem("AYA_resto_abonnes")) || [];
    if (list.length === 0) return alert("Liste vide !");

    let text = "ABONNÉS AYA RESTO / AYA RESTO\n=================================\n";
    list.forEach((a, i) => { text += `${i + 1}. ${a.nom} - ${a.telephone} (${a.date})\n`; });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "abonnes_aya_resto.txt";
    a.click();
}

function effacerAbonnes() {
    if (confirm("Effacer tous les abonnés ?")) {
        localStorage.removeItem("aya_resto_abonnes");
        chargerListeAbonnes();
    }
}