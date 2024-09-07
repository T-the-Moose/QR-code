import readline from 'readline';
import QRCode from 'qrcode';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

// Fonction pour lire une image et la convertir en base64
function convertirImageEnBase64(imagePath, callback) {
    const imagePathNormalise = path.normalize(imagePath);

    fs.readFile(imagePathNormalise, (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture de l\'image :', err);
            return;
        }
        const imageBase64 = data.toString('base64');
        callback(imageBase64);
    });
}

function demanderURL() {
    rl.question('------ Quelle URL est à transformer en QR code ? ------\n', url => {
        const urlRegex = /^https:\/\/[^\s/$.?#].[^\s]*$/;

        if (!urlRegex.test(url)) {
            console.error('** L\'URL entrée n\'est pas valide **');
            demanderURL(); 
            return;
        }

        rl.question('Quel nom souhaitez-vous donner au fichier PNG (sans extension) ? \n', filename => {
            
            rl.question('Quelle couleur pour les points du QR code ? Veuillez choisir une couleur assez sombre ou clair (ex: #000000) \n', couleurPoints => {
                rl.question('Quelle couleur pour le fond du QR code ? Veuillez choisir une couleur assez sombre ou clair (ex: #ffffff) \n', couleurFond => {
                    
                    const largeurQR = 512; // Taille du QR code
                    const tailleImage = 200; // Taille de l'image au centre (A modifier si souhait d'une image plus grande ou plus petite)

                    const fichierTelechargement = path.join(os.homedir(), 'Downloads');
                    const nomDuFichier = path.join(fichierTelechargement, `${filename}.png`);

                    QRCode.toBuffer(url, {
                        width: largeurQR,
                        color: {
                            dark: couleurPoints,
                            light: couleurFond
                        }
                    }, function (err, buffer) {
                        if (err) {
                            console.error('Une erreur est survenue lors de la génération du QR code :', err);
                            return;
                        }

                        rl.question('Voulez-vous ajouter une image au centre du QR code ? (o/n) \n', reponse => {
                            if (reponse.toLowerCase() === 'o') {
                                rl.question('Veuillez entrer le chemin du fichier image (format PNG + 200x200px uniquement) : \n', imagePath => {
                                    convertirImageEnBase64(imagePath, imageBase64 => {
                                        const imageBuffer = Buffer.from(imageBase64, 'base64');

                                        const positionImage = (largeurQR - tailleImage) / 2; 

                                        sharp(buffer)
                                            .composite([{
                                                input: imageBuffer,
                                                top: positionImage,
                                                left: positionImage,
                                                width: tailleImage,
                                                height: tailleImage
                                            }])
                                            .toFile(nomDuFichier, (err) => {
                                                if (err) {
                                                    console.error('Erreur lors de l\'ajout de l\'image au QR code :', err);
                                                } else {
                                                    console.log(`\n------ QR code avec image enregistré dans : ${nomDuFichier} ------\n`);
                                                }
                                                demanderAutreURL();
                                            });
                                    });
                                });
                            } else {
                                fs.writeFile(nomDuFichier, buffer, (err) => {
                                    if (err) {
                                        console.error('Erreur lors de l\'écriture du fichier PNG :', err);
                                    } else {
                                        console.log(`\n------ QR code enregistré dans : ${nomDuFichier} ------\n`);
                                    }
                                    demanderAutreURL();
                                });
                            }
                        });
                    });
                });
            });
        });
    });
}

function demanderAutreURL() {
    rl.question('------- Voulez-vous transformer une autre URL ? (o/n) ------- \n', answer => {
        if (answer.toLowerCase() === 'o') {
            demanderURL();
        } else {
            console.log('------ Fermeture du programme ------');
            rl.close();
        }
    });
}

demanderURL();
