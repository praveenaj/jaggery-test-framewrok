//define test suites

var Car = require('../../../modules/car.js').Car;

test.describe('TestSuiteTwo-Toyota', function() {

    //config data for helping to test
    var myCar, newCar = null, myCarConfig = {
        name : "Vitz",
        engineSize : 1000
    }, newCarConfig = {
        name : "Prius",
        engineSize : 1800
    };

    //setting and define object to testing
    test.beforeEach(function() {
        myCar = new Car(myCarConfig);
        newCar = new Car(newCarConfig);
    });

    //First test for to check was car built fine.
    test.it('Testing Car name and Engineer size is validate to Drive', function() {
        test.expect(myCar.name).toEqual("Vitz");
        test.expect(myCar.engineSize).toEqual(1000);
    });

    // grouping test for Engine Turning Test
    test.describe("TurningEngineForToyotaCar", function() {

        // checking test platform work fine
        test.it("Checking testing platform is turned to test", function() {
            test.expect(1).toEqual(1);
        });

        // testing car (function) racing by enginee
        test.it("Checking Engineer capacity for Express way to ride", function() {
            test.expect(myCar.getEngineSize()).toEqual(1000);
        });

    });

    test.describe("upgradeEngineSizeOfToyotacar", function() {

        test.it("Checking testing platform is turned to test", function() {
            test.expect(1).toBe(1);
        });

        test.it("upgradeEngineSize to testing", function() {
            test.expect(myCar.upgradeEngineSize()).toBe(1500);
            test.expect(newCar.upgradeEngineSize()).toBe(2300);

        });

    });

});

