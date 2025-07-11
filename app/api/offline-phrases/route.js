export async function GET() {
  const phrases = {
    child_safety: {
      pl: {
        "Zgubiłem się ale moi rodzice monitorują gdzie jestem więc zaraz powinni tu być": {
          en: "I'm lost but my parents are tracking my location so they should be here soon",
          fr: "Je suis perdu mais mes parents suivent ma position donc ils devraient arriver bientôt"
        },
        "Nazywam się ... i mam ... lat": {
          en: "My name is ... and I am ... years old",
          fr: "Je m'appelle ... et j'ai ... ans"
        },
        "Moi rodzice mówią po angielsku": {
          en: "My parents speak English",
          fr: "Mes parents parlent anglais"
        },
        "Telefon do mamy/taty": {
          en: "Mom/Dad's phone number",
          fr: "Numéro de téléphone de maman/papa"
        },
        "Proszę zadzwonić do moich rodziców": {
          en: "Please call my parents",
          fr: "S'il vous plaît appelez mes parents"
        },
        "Jestem z Polski": {
          en: "I am from Poland",
          fr: "Je viens de Pologne"
        },
        "Potrzebuję znaleźć moich rodziców": {
          en: "I need to find my parents",
          fr: "Je dois retrouver mes parents"
        },
        "Czy może mi Pan/Pani pomóc?": {
          en: "Can you help me please?",
          fr: "Pouvez-vous m'aider s'il vous plaît?"
        }
      },
      en: {
        "I'm lost but my parents are tracking my location so they should be here soon": {
          pl: "Zgubiłem się ale moi rodzice monitorują gdzie jestem więc zaraz powinni tu być",
          fr: "Je suis perdu mais mes parents suivent ma position donc ils devraient arriver bientôt"
        },
        "My name is ... and I am ... years old": {
          pl: "Nazywam się ... i mam ... lat",
          fr: "Je m'appelle ... et j'ai ... ans"
        },
        "My parents speak English": {
          pl: "Moi rodzice mówią po angielsku",
          fr: "Mes parents parlent anglais"
        },
        "Mom/Dad's phone number": {
          pl: "Telefon do mamy/taty",
          fr: "Numéro de téléphone de maman/papa"
        },
        "Please call my parents": {
          pl: "Proszę zadzwonić do moich rodziców",
          fr: "S'il vous plaît appelez mes parents"
        },
        "I am from Poland": {
          pl: "Jestem z Polski",
          fr: "Je viens de Pologne"
        },
        "I need to find my parents": {
          pl: "Potrzebuję znaleźć moich rodziców",
          fr: "Je dois retrouver mes parents"
        },
        "Can you help me please?": {
          pl: "Czy może mi Pan/Pani pomóc?",
          fr: "Pouvez-vous m'aider s'il vous plaît?"
        }
      },
      fr: {
        "Je suis perdu mais mes parents suivent ma position donc ils devraient arriver bientôt": {
          pl: "Zgubiłem się ale moi rodzice monitorują gdzie jestem więc zaraz powinni tu być",
          en: "I'm lost but my parents are tracking my location so they should be here soon"
        },
        "Je m'appelle ... et j'ai ... ans": {
          pl: "Nazywam się ... i mam ... lat",
          en: "My name is ... and I am ... years old"
        },
        "Mes parents parlent anglais": {
          pl: "Moi rodzice mówią po angielsku",
          en: "My parents speak English"
        },
        "Numéro de téléphone de maman/papa": {
          pl: "Telefon do mamy/taty",
          en: "Mom/Dad's phone number"
        },
        "S'il vous plaît appelez mes parents": {
          pl: "Proszę zadzwonić do moich rodziców",
          en: "Please call my parents"
        },
        "Je viens de Pologne": {
          pl: "Jestem z Polski",
          en: "I am from Poland"
        },
        "Je dois retrouver mes parents": {
          pl: "Potrzebuję znaleźć moich rodziców",
          en: "I need to find my parents"
        },
        "Pouvez-vous m'aider s'il vous plaît?": {
          pl: "Czy może mi Pan/Pani pomóc?",
          en: "Can you help me please?"
        }
      }
    },
    emergency: {
      pl: {
        "Potrzebuję pomocy": {
          en: "I need help",
          fr: "J'ai besoin d'aide"
        },
        "Gdzie jest szpital?": {
          en: "Where is the hospital?",
          fr: "Où est l'hôpital?"
        },
        "Dzwońcie po karetkę": {
          en: "Call an ambulance",
          fr: "Appelez une ambulance"
        },
        "Czy mówi Pan/Pani po polsku?": {
          en: "Do you speak Polish?",
          fr: "Parlez-vous polonais?"
        }
      },
      en: {
        "I need help": {
          pl: "Potrzebuję pomocy",
          fr: "J'ai besoin d'aide"
        },
        "Where is the hospital?": {
          pl: "Gdzie jest szpital?",
          fr: "Où est l'hôpital?"
        },
        "Call an ambulance": {
          pl: "Dzwońcie po karetkę",
          fr: "Appelez une ambulance"
        },
        "Do you speak English?": {
          pl: "Czy mówi Pan/Pani po angielsku?",
          fr: "Parlez-vous anglais?"
        }
      },
      fr: {
        "J'ai besoin d'aide": {
          pl: "Potrzebuję pomocy",
          en: "I need help"
        },
        "Où est l'hôpital?": {
          pl: "Gdzie jest szpital?",
          en: "Where is the hospital?"
        },
        "Appelez une ambulance": {
          pl: "Dzwońcie po karetkę",
          en: "Call an ambulance"
        },
        "Parlez-vous français?": {
          pl: "Czy mówi Pan/Pani po francusku?",
          en: "Do you speak French?"
        }
      }
    },
    transport: {
      pl: {
        "Gdzie jest lotnisko?": {
          en: "Where is the airport?",
          fr: "Où est l'aéroport?"
        },
        "Ile to kosztuje?": {
          en: "How much does it cost?",
          fr: "Combien ça coûte?"
        },
        "Czy to jest właściwy peron?": {
          en: "Is this the right platform?",
          fr: "Est-ce le bon quai?"
        },
        "O której odjeżdża pociąg do...?": {
          en: "What time does the train to... leave?",
          fr: "À quelle heure part le train pour...?"
        }
      },
      en: {
        "Where is the airport?": {
          pl: "Gdzie jest lotnisko?",
          fr: "Où est l'aéroport?"
        },
        "How much does it cost?": {
          pl: "Ile to kosztuje?",
          fr: "Combien ça coûte?"
        },
        "Is this the right platform?": {
          pl: "Czy to jest właściwy peron?",
          fr: "Est-ce le bon quai?"
        },
        "What time does the train leave?": {
          pl: "O której odjeżdża pociąg?",
          fr: "À quelle heure part le train?"
        }
      },
      fr: {
        "Où est l'aéroport?": {
          pl: "Gdzie jest lotnisko?",
          en: "Where is the airport?"
        },
        "Combien ça coûte?": {
          pl: "Ile to kosztuje?",
          en: "How much does it cost?"
        },
        "Est-ce le bon quai?": {
          pl: "Czy to jest właściwy peron?",
          en: "Is this the right platform?"
        },
        "À quelle heure part le train?": {
          pl: "O której odjeżdża pociąg?",
          en: "What time does the train leave?"
        }
      }
    },
    basic: {
      pl: {
        "Dziękuję": {
          en: "Thank you",
          fr: "Merci"
        },
        "Przepraszam": {
          en: "Excuse me",
          fr: "Excusez-moi"
        },
        "Gdzie jest toaleta?": {
          en: "Where is the toilet?",
          fr: "Où sont les toilettes?"
        },
        "Nie rozumiem": {
          en: "I don't understand",
          fr: "Je ne comprends pas"
        }
      },
      en: {
        "Thank you": {
          pl: "Dziękuję",
          fr: "Merci"
        },
        "Excuse me": {
          pl: "Przepraszam",
          fr: "Excusez-moi"
        },
        "Where is the toilet?": {
          pl: "Gdzie jest toaleta?",
          fr: "Où sont les toilettes?"
        },
        "I don't understand": {
          pl: "Nie rozumiem",
          fr: "Je ne comprends pas"
        }
      },
      fr: {
        "Merci": {
          pl: "Dziękuję",
          en: "Thank you"
        },
        "Excusez-moi": {
          pl: "Przepraszam",
          en: "Excuse me"
        },
        "Où sont les toilettes?": {
          pl: "Gdzie jest toaleta?",
          en: "Where is the toilet?"
        },
        "Je ne comprends pas": {
          pl: "Nie rozumiem",
          en: "I don't understand"
        }
      }
    }
  };

  return Response.json(phrases);
}