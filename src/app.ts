import * as readline from 'readline';
import * as fs from 'fs';

export default class App {

    packetSizes: number[];
    orders: any[];
    rl: any;

    constructor() {
        console.log('sweet shop starting up...');

        this.config();

        // user input 
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.mainMenu();
    }

    async config() {
        const rawdata = fs.readFileSync('config.json');
        const config = JSON.parse(rawdata.toString());
        this.packetSizes = config.packetSizes || [];
        this.orders = config.orders || [];
    }

    async save() {
        fs.writeFile('config.json', JSON.stringify({
            orders: this.orders,
            packetSizes: this.packetSizes
        }), (err) => {
            if (err) return console.log(err);
        });
    }

    calcOrder(amount:number){

        let selectedPackets = [];
        const sortedPackets = this.packetSizes.sort((a, b) => a - b);

        while (selectedPackets.length == 0 || selectedPackets.reduce((a, b) => a + b, 0) < amount){
            for (let i = 0; i < sortedPackets.length; i++) {
                if(sortedPackets[i] >= (amount - selectedPackets.reduce((a, b) => a + b, 0)) || i == (sortedPackets.length - 1)){
                    // get lower packet size which is above remaining || or last biggest packet
                    selectedPackets.push(sortedPackets[i]);
                    break;
                }
            }
        }
        return selectedPackets;
    }


    async mainMenu() {
        let selection = await new Promise((resolve, reject) => {
            this.rl.question("sweetshop menu, select an option\n[0] - create order\n[1] - view packet sizes\n[2] - exit\n", (input: string) => {
                resolve(input);
                // this.rl.close();
            });
        });
        // this.rl.close();
        switch (Number(selection)) {
            case 0:
                // * create order
                console.log('creating new order');
                this.getNumber('Order amount\n').then((data) => {
                    if (!isNaN(data as number)) {
                        const packets = this.calcOrder(data);
                        const order = {
                            amount:data,
                            packets: packets,
                            total: packets.reduce((a, b) => a + b, 0)
                        };
                        this.orders.push(order);
                        this.save();
                        console.log(`Order packets calculated\n ${JSON.stringify(order)}`);
                    } else {
                        console.log(`Invalid order amount\n`);
                    }
                    this.mainMenu();
                });
                break;
            case 1:
                // * packet size menu
                this.packetMenu();
                break;
            case 2:
                // * exit program
                console.log('sweet shop shutting down...');
                this.rl.close();
                process.exit(0);
                break;
            default:
                console.log('no option selected, please try again');
                this.mainMenu();
                break;
        }
    }

    async getNumber(msg: string) {

        let number;
        let exit = false;

        while (isNaN(number) && !exit) {
            number = await new Promise((resolve, reject) => {
                this.rl.question(msg, (input: string) => {
                    resolve(input);
                });
            });
            if (number == 'back' || number == 'remove') {
                exit = true;
            } else if(isNaN(number)){
                console.log('invalid number, try again');
            }
        }
        // this.rl.close();
        return number;
    }

    async packetMenu() {
        let selection = await new Promise((resolve, reject) => {
            this.rl.question(`Packet menu, select an option\n${this.packetSizes.map((p:number, i:number) => `[${i}] ${p}`).join('\n')}\n[add] add new packet\n[back] back to main menu\n`, (input: string) => {
                resolve(input);
            });
        });

        if (!isNaN(selection as number) && Number(selection) < this.packetSizes.length) {
            const index = Number(selection);
            // edit packet
            console.log(`editing packet [${index}] ${this.packetSizes[index]}`);
            this.getNumber('enter updated packet size or [remove] which will remove this packet size\n').then((data: any) => {
                if (!isNaN(data as number)) {
                    // update packet
                    this.packetSizes[index] = Number(data);
                    console.log('updated packet size');
                    this.save();
                } else if(data == 'remove'){
                    // invalid
                    this.packetSizes.splice(index, 1);
                    this.save();
                    console.log('packet size removed')
                } else {
                    console.log('invalid number, back to packet menu')
                }
                this.packetMenu();
            });
        } else {
            switch (selection) {
                case 'add':
                    console.log(`Adding new packet size`);
                    this.getNumber('enter new packet size\n').then((data: any) => {
                        console.log(data);
                        if (!isNaN(data as number)) {
                            // add packet
                            this.packetSizes.push(Number(data));
                            console.log('added new packet')
                            this.save();
                        } else {
                            // invalid
                            console.log('invalid number, back to packet menu')
                        }
                        this.packetMenu();
                    });
                    break;
                case 'back':
                    this.mainMenu();
                    break;
                default:
                    break;
            }
            // check other options
        }
    }
}