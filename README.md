# Soon to be awesome project!

## HA scripts
What was created                                                                                                                                                                           
                                                                                                                                                                                             
  configuration.yaml                                                                                                                                                                         
                                                                                                                                                                                             
  - rest_command.memento_get_token — POST to /api/auth/token, variables client_id/client_secret injected from data: at call time                                                             
  - rest_command.memento_generate_newspaper — POST to /api/v1/newspaper/generate, Bearer token injected from the first call's response                                                       
  - shell_command.memento_print_pdf — curl url | lp -d Brother_HL-3152CDW_series - (see printer note below)                                                                                  
  - 6 input helpers — memento_client_id, memento_client_secret, memento_template_id, memento_printer_entity, memento_last_status, memento_last_error                                         
  - input_datetime.memento_last_run                                                                                                                                                          
                                                                                                                                                                                             
  scripts.yaml — memento_print_newspaper                                                                                                                                                     
                                                                                                                                                                                             
  The script has 5 clearly-labelled steps, each with:                                                                                                                                        
  - system_log.write at info level → visible in Settings > System > Logs (search [Memento])                                                                                                  
  - Explicit guard blocks with stop: … error: true on every failure path                                                                                                                     
  - persistent_notification.create for every error → appears instantly in the UI bell icon                                                                                                   
  - input_text.memento_last_status / memento_last_error updated at each step → put them on any dashboard card                                                                                
                                                                                                                                                                                             
  automations.yaml                                                                                                                                                                           
                                                                                                                                                                                             
  Daily trigger at 07:00 — change the at: "07:00:00" to whatever time you want.                                                                                                              
                                                                                                                                                                                             
  ---                                                                                                                                                                                        
  First-time setup                                                                                                                                                                           
                                                                                                                                                                                             
  1. Restart HA (Settings > System > Restart) to load the new rest_command, shell_command, and input_text blocks.                                                                            
                                                                                                                                                                                             
  2. Fill in credentials — Settings > Helpers, search "Memento":                                                                                                                             
                                                                                                                                                                                             
  ┌───────────────────────┬──────────────────────────────────────────────────────────────────┐                                                                                               
  │        Helper         │                              Value                               │                                                                                               
  ├───────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Memento Client ID     │ mc_12517c40c108cdf9b5319f2d96ba988a                              │
  ├───────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Memento Client Secret │ e339384a2f742efc12f219f04f7439690269eca8f455cdc73726ea8b85864462 │                                                                                               
  ├───────────────────────┼──────────────────────────────────────────────────────────────────┤                                                                                               
  │ Memento Template ID   │ d4b6f76c-7b2d-4e28-af89-1cfe633304d6                             │                                                                                               
  └───────────────────────┴──────────────────────────────────────────────────────────────────┘                                                                                               
                                                            
  3. Test manually — Developer Tools > Actions > script.memento_print_newspaper > Call.                                                                                                      
                                                            
  4. Watch the trace — Scripts panel > "Memento: Print Newspaper" > last run trace. Every step, every response body, and any error is logged there.                                          
                                                            
  ---                                                                                                                                                                                        
  About the lp (CUPS) printer command                       
                                                                                                                                                                                             
  The ipp integration only provides status sensors — HA has no built-in "print a document" action. The shell_command.memento_print_pdf uses lp, which requires CUPS to be installed in HA OS.
                                                                                                                                                                                             
  Check if it's available: open the Advanced SSH & Web Terminal add-on and run:                                                                                                              
  lp --version                                                                                                                                                                               
  lpstat -p                                                                                                                                                                                  
                                                            
  If lp is missing, install the CUPS add-on from the Add-on Store. When the print step fails, the error notification will show you the exact stderr message, the return code, and the direct
  PDF URL so you can open/print it manually in the meantime.
