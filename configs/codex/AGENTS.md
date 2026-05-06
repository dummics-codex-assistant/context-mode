# context-mode per Codex

context-mode e' disponibile come MCP e come hook Codex. Usalo come strumento di igiene del contesto, non come stile di risposta o workflow dominante.

## Principio

context-mode serve a salvare finestra di contesto senza perdere evidenza. Deve indicizzare rumore, restringere shortlist e recuperare passaggi rilevanti; non deve diventare una fonte finale non verificata.

Non sostituisce le istruzioni globali dell'owner, le skill del progetto, `AGENTS.md` locali, gate Git/write, review policy o tono richiesto. Se queste regole confliggono con le istruzioni globali, vincono le istruzioni globali.

## Retrieval vs proof

- Usa `ctx_*` per discovery, sintesi, indicizzazione, confronto e ripresa sessione.
- Per finding, fix, review, decisioni architetturali o affermazioni ad alta accuratezza, verifica poi su file reali, diff, test, log filtrati o fonti ufficiali.
- Non citare un risultato `ctx_search` come prova definitiva se la conclusione dipende da una riga di codice o da un contratto preciso.
- Riporta sempre path, comando/query usata, evidenza minima e residuo di incertezza quando conta.

## Quando usarlo

- log lunghi, transcript, JSONL, sessioni, output CI/test voluminoso
- `rg`, `git`, scansioni o inventari con molti risultati
- confronto tra molti file o directory
- scouting approfondito di docs, cataloghi, routing documentale o riferimenti MCP/tooling
- analisi di dati strutturati, conteggi, filtri, deduplica, clustering
- pagine web o documenti grandi da indicizzare e interrogare
- ripresa sessione quando serve cercare decisioni o vincoli gia' indicizzati

## Quando non serve

- comandi Git brevi e mirati
- lettura di pochi file prima di editarli
- diff piccoli o file gia' identificati
- verifiche che producono meno di circa 20 righe utili
- micro-risposte o domande concettuali senza bisogno di contesto locale

## Scelta strumenti

0. `ctx_search(queries, sort: "timeline")`: dopo resume/compact, cerca decisioni, vincoli, rejected approach e summary prima di chiedere all'utente.
1. `ctx_batch_execute(commands, queries)`: default per discovery multi-comando. Usa label descrittive: diventano titoli FTS5 e aiutano il recupero.
2. `ctx_search(queries, source, sort)`: follow-up su contenuto gia' indicizzato. Passa tutte le domande correlate in un'unica chiamata.
3. `ctx_execute(language, code)`: analisi computazionale, filtri, conteggi, parsing e sintesi. Stampa solo il risultato utile.
4. `ctx_execute_file(path, language, code)`: analisi di file grande senza portarlo tutto nel contesto.
5. `ctx_fetch_and_index(url, source)`: pagine/documenti web grandi; poi interrogare con `ctx_search`.

Per creare o modificare file usa gli strumenti nativi di Codex. Non usare context-mode come writer di file.

Per scouting docs/repo ampio: usa prima `ctx_batch_execute` con `rg` mirati, letture di indici/cataloghi e query di follow-up; poi passa a letture normali solo sui file shortlist.

## Hook e sicurezza del contesto

Gli hook possono bloccare o guidare operazioni rumorose come fetch raw, `curl`/`wget`, HTTP inline o output enormi. Se un hook blocca un comando, riformula l'azione con output filtrato o usa uno dei tool `ctx_*`.

Non aggirare l'hook ripetendo lo stesso comando con un wrapper diverso. Riduci l'output o indicizzalo.

Azioni da evitare quando l'output puo' esplodere:

- Shell normale per output atteso sopra circa 20 righe: usa `ctx_batch_execute` o `ctx_execute`.
- Lettura raw di file grandi solo per analizzarli: usa `ctx_execute_file`. Lettura normale ok se devi editare.
- Web fetch raw o inline HTTP: usa `ctx_fetch_and_index`, oppure `ctx_execute` se serve una chiamata API filtrata.
- `ctx_execute` o `ctx_execute_file` per creare/modificare file: sono strumenti di analisi, non di scrittura.

## Parallel I/O

Quando indicizzi o interroghi molte fonti I/O-bound, usa batch e concorrenza dove supportato:

- `ctx_batch_execute` per piu' comandi indipendenti o query correlate.
- `ctx_fetch_and_index` per documenti web grandi, poi `ctx_search`.
- Concorrenza 4-8 per I/O-bound; 1 per build, test, lint, porte/lock condivisi o comandi che toccano lo stesso repo.
- Per GitHub API o `gh`, non superare concorrenza 4 per evitare rate-limit e rumore.

## Session continuity

La knowledge base resta interrogabile dopo compact/clear finche' non viene purgata. Prima di chiedere "cosa stavamo facendo?", cerca:

- `ctx_search(queries: ["summary"], source: "compaction", sort: "timeline")`
- `ctx_search(queries: ["decision"], source: "decision", sort: "timeline")`
- `ctx_search(queries: ["rejected"], source: "rejected-approach", sort: "timeline")`
- `ctx_search(queries: ["constraint"], source: "constraint", sort: "timeline")`

Se non emerge nulla di utile, procedi come sessione fresca e dichiaralo brevemente.

## Windows notes

- Se il sandbox usa bash e servono cmdlet PowerShell, usa `pwsh -NoProfile -Command "..."`.
- Converti path assoluti Windows in modo coerente col runtime che stai usando. In Git Bash/MSYS, `C:\Users\...` diventa `/c/Users/...`, non `/mnt/c/...`.
- Quote sempre i path con spazi.
- Gli hook Windows sono parte della superficie critica: non disabilitarli per bypassare un blocco rumoroso; migliora il routing o filtra l'output.

## Peer/agent context

Eventuali MCP separati per coordinamento agenti, come peer/mailing-list, devono restare separati da context-mode. context-mode puo' indicizzare, sintetizzare o recuperare messaggi/eventi prodotti da quei sistemi, ma non deve diventare il bus operativo ne' duplicare le loro responsabilita'.

Integrazione sana:

- peer MCP emette eventi o thread agentici con metadati chiari
- context-mode li indicizza come fonti ricercabili con source label stabili
- gli hook possono suggerire recupero via `ctx_search` quando il task dipende da decisioni o handoff precedenti
- nessun hook deve inviare messaggi peer automaticamente senza intenzione esplicita dell'utente o policy dedicata

## Comandi utente

- `ctx stats`: mostra statistiche context-mode.
- `ctx doctor`: diagnostica installazione/hook/MCP.
- `ctx upgrade`: aggiorna context-mode, poi riavvio sessione.
- `ctx purge`: irreversibile; usare solo se l'owner lo chiede esplicitamente.

## Stile

Rispondi nella lingua e nel tono richiesti dalle istruzioni globali. context-mode deve rendere il lavoro piu' leggero e verificabile, non cambiare personalita', formato o priorita' operative.
