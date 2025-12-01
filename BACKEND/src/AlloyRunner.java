import edu.mit.csail.sdg.alloy4.A4Reporter;
import edu.mit.csail.sdg.alloy4.Err;
import edu.mit.csail.sdg.alloy4.ErrorWarning;
import edu.mit.csail.sdg.alloy4compiler.ast.Command;
import edu.mit.csail.sdg.alloy4compiler.ast.Module;
import edu.mit.csail.sdg.alloy4compiler.parser.CompUtil;
import edu.mit.csail.sdg.alloy4compiler.translator.A4Options;
import edu.mit.csail.sdg.alloy4compiler.translator.A4Solution;
import edu.mit.csail.sdg.alloy4compiler.translator.TranslateAlloyToKodkod;

public class AlloyRunner {
    public static void main(String[] args) throws Err {
        if (args.length < 1) {
            System.out.println("Usage: java -cp .;alloy4.2.jar AlloyRunner <als_file>");
            return;
        }

        String filename = args[0];

        A4Reporter rep = new A4Reporter() {
            @Override
            public void warning(ErrorWarning msg) {
                System.out.print("Relevance Warning:\n" + (msg.toString().trim()) + "\n\n");
                System.out.flush();
            }
        };

        Module world = CompUtil.parseEverything_fromFile(rep, null, filename);
        A4Options options = new A4Options();
        options.solver = A4Options.SatSolver.SAT4J;

        System.out.println("Available commands: " + world.getAllCommands());

        for (Command command : world.getAllCommands()) {
            System.out.println("Executing command: " + command.label);

            // Execute the command
            A4Solution ans = TranslateAlloyToKodkod.execute_command(rep, world.getAllReachableSigs(), command, options);

            // Export to XML
            String xmlPath = filename.replace(".als", ".xml");
            ans.writeXML(xmlPath);
            System.out.println("XML generated at: " + xmlPath);

            // We only need to run the first command
            break;
        }
    }
}
