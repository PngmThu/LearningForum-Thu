pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;

contract RentalFactory {
    address[] private deployedRental;
    mapping(address => address) public users;

    /******************************************************************/
    //function() payable { }
    /******************************************************************/
    
    // function createRental(string productName, string description, uint rentalFee, uint deposit, 
    //                             uint maxDuration, bool publish, string imageHashes) public payable {
    //     if (users[msg.sender] == 0) {
    //         address profile = new Profile(msg.sender);
    //         users[msg.sender] = profile;
    //     }    
    //     address newRental = new Rental(productName, description, rentalFee, deposit, 
    //                                         maxDuration, publish, msg.sender, imageHashes, users[msg.sender]);
    //     deployedRental.push(newRental);

    //     /*********************************************************************/
        
    //     Rental rental = Rental(newRental);
    //     rental.transfer(msg.value);
    //     rental.rentItem(msg.sender, msg.value, users[msg.sender]);  //Save rented time here
        
    // }

    /*************************************************************************************************/
    function createQuestion(string productName, string description, uint deposit, 
                    uint maxDuration, string[] fileHashesQuestion, string[] fileNamesQuestion) public payable {
        if (users[msg.sender] == 0) {
            address profile = new Profile(msg.sender);
            users[msg.sender] = profile;
        }    
        address newRental = new Rental(productName, description, deposit, maxDuration,
                                    fileHashesQuestion, fileNamesQuestion, msg.sender, users[msg.sender]);
        deployedRental.push(newRental);
        
        Rental rental = Rental(newRental);
        rental.transfer(msg.value);
        //Profile(msg.sender).updateToken('sub', deposit);
        Profile(users[msg.sender]).updateToken(0, deposit);
        rental.postQuestion();  //Save posted time here
        
    }

    function createAnswer(address rent, string _reply, string[] _fileHashes, string[] _fileNames) public {
        if (users[msg.sender] == 0) {
            address profile = new Profile(msg.sender);
            users[msg.sender] = profile;
        }   
        Rental rental = Rental(rent);
        rental.answer(_reply, _fileHashes, _fileNames, msg.sender, users[msg.sender]);
    
    }

    function rentItemAt(address rent) public payable {
        if (users[msg.sender] == 0) {
            address profile = new Profile(msg.sender);
            users[msg.sender] = profile;
        }

        Rental rental = Rental(rent);
        rental.transfer(msg.value);
        //'0xCd51750b7f9Cc9A16541432676e736B88c44BD26'.transfer(msg.value);
        rental.rentItem(msg.sender, msg.value, users[msg.sender]);  //Save rented time here
    }
    /**********************************************/
    function ratingQuestionAt(address rent, uint _ratingQuestion) public payable{
        if (users[msg.sender] == 0) {
            address profile = new Profile(msg.sender);
            users[msg.sender] = profile;
        }

        Rental rental = Rental(rent);
        rental.transfer(msg.value);
        //'0xCd51750b7f9Cc9A16541432676e736B88c44BD26'.transfer(msg.value);
        rental.ratingQuestion(_ratingQuestion);  //Update Rate
        rental.updateDeposite(1);
        //Profile(msg.sender).updateToken('sub', 1);
        Profile(users[msg.sender]).updateToken(0, 1);
    }

    function ratingAnswerAt(address rent, uint _ratingAnswer, uint _index) public payable {
        if (users[msg.sender] == 0) {
            address profile = new Profile(msg.sender);
            users[msg.sender] = profile;
        }

        Rental rental = Rental(rent);
        rental.transfer(msg.value);
        //'0xCd51750b7f9Cc9A16541432676e736B88c44BD26'.transfer(msg.value);
        rental.updateAnswerRate(_ratingAnswer, _index);  //Update Answer Rate
    }

    // function shareToken(address rent) public payable {
    //     if (users[msg.sender] == 0) {
    //         address profile = new Profile(msg.sender);
    //         users[msg.sender] = profile;
    //     }

    //     Rental rental = Rental(rent);
    //     rental.updateShareToken();
    //     uint[] memory money = rental.getShareTokenListMoney();
    //     address[] memory answerer = rental.getShareTokenListAnswerer();
    //     for (uint i = 0;i < money.length;i++) {
    //         answerer[i].transfer(money[i]/1000000000000000000);
    //     }
    // }

    function shareTokenAt(address rent) public payable {
        if (users[msg.sender] == 0) {
            address profile = new Profile(msg.sender);
            users[msg.sender] = profile;
        }

        Rental rental = Rental(rent);
        rental.shareToken();
    }
    /**********************************************/

    function hasProfile(address _user) public returns(bool) {
        if (users[_user] == 0) {
            return false;
        } else {
            return true;
        }
    }

    function getProfile(address _user) public returns(address) {
        require(users[_user] != 0);
        return users[_user];
    }
    
    function getDeployedRentals() public view returns(address[]) {
        return deployedRental;
    }
    
    /*********************************************************************/

    function publishItemAt(address rent) public payable {
        if (users[msg.sender] == 0) {
            address profile = new Profile(msg.sender);
            users[msg.sender] = profile;
        }

        Rental rental = Rental(rent);
        rental.transfer(msg.value);
        //'0xCd51750b7f9Cc9A16541432676e736B88c44BD26'.transfer(msg.value);
        rental.rentItem(msg.sender, msg.value, users[msg.sender]);  //Save rented time here
    }
}


contract Rental {

    string public imageHashes;

    struct Dispute {
        string title;
        string description;
        string imageHash;
        uint8 approvalCount;
        uint8 rejectionCount;
        bool complete;
        uint startTime;
        uint incentives;
        uint8 penaltyFee;
        address disputer;
        mapping(address => bool) approvals;
        mapping(address => bool) rejections;
    }

    Dispute[] public disputes;

    /***************************************************************/
    struct Answer {
        string replyHash;
        string[] fileHashes;
        string[] fileNames;
        address answerer;
        Profile answererP;
        uint answerTime;
        uint answerRate; 
        uint answerNumRate;
        uint answerSumRate;
    }

    Answer[] public answerList;
    string[] public fileHashesQuestion;
    string[] public fileNamesQuestion;
    /***************************************************************/
    
    uint8 public disputeCounts;
    bool public openDisputeRenter;
    bool public openDisputeOwner;
    bool public hasReclaim;
    
    string public productName;
    string public description;
    uint public rentalFee;
    uint public deposit;
    uint public maxDuration;
    address public owner;
    address public renter;
    Profile private ownerP;
    Profile private renterP;

    uint public start;
    uint public totalRentingFee;
    uint public historyIndex;

    /****************************************/
    uint public questionRate;
    uint public numRate;
    uint public sumRate;
    uint public checkShareToken;
    uint public tokenSum;
    uint public proportion;
    uint public numPeople;
    /****************************************/

    enum State { IDLE, PUBLISHED, RENTED, AWAITPAYMENT, DELETED }
    State public state;

    function getState() public view returns (string) {
        if (state == State.IDLE) {
            return "IDLE";
        }else if (state == State.PUBLISHED) {
            return "PUBLISHED";
        } else if (state == State.RENTED) {
            return "RENTED";
        } else if (state == State.AWAITPAYMENT) {
            return "AWAITPAYMENT";
        } else if (state == State.DELETED) {
            return "DELETED";
        }
    }

    modifier restrictedToOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier restrictedToRenter() {
        require(msg.sender == renter);
        _;
    }

    modifier inState(State _state) {
        require(state == _state);
        _;
    }

    function() payable { }

    function Rental (string _productName, string _description, uint _deposit, uint _maxDuration, string[] _fileHashesQuestion, string[] _fileNamesQuestion, address _owner, address _ownerP) public {
        productName = _productName;
        description = _description;
        //rentalFee = _rentalFee;
        deposit = _deposit;
        maxDuration = _maxDuration;
        fileHashesQuestion = _fileHashesQuestion;
        fileNamesQuestion = _fileNamesQuestion;
        owner = _owner;
        //imageHashes = _imageHashes;
        ownerP = Profile(_ownerP);
        //state = _publish? State.PUBLISHED : State.IDLE;
    }

function getSummary() public view returns (
        string, string, uint, uint, uint, address, address, string[], string[]
    ) {
        return(
            productName,
            description,
            rentalFee,
            deposit,
            maxDuration,
            owner,
            renter,
            fileHashesQuestion,
            fileNamesQuestion
        );
    }

    /**********************************************/
    function getOwner() public view returns (address){
        return owner;
    }
    /**********************************************/
    function getTime() public view returns (uint, uint, uint) {
        return(
            start,
            now,
            maxDuration
        );
    }

    function cancelled() public restrictedToOwner inState(State.PUBLISHED) {
        state = State.IDLE;
    }

    function publish() public restrictedToOwner inState(State.IDLE) {
        state = State.PUBLISHED;
    }

    function deleted() public restrictedToOwner {
        state = State.DELETED;
    }

    /**********************************************/

    function ratingQuestion(uint _ratingQuestion) public {
        numRate++;
        sumRate = sumRate + _ratingQuestion;
        questionRate = sumRate/numRate;
    }

    function returnRatingQuestion() public returns (uint){
        return questionRate;
    }

    function returnSumQuestion() public returns (uint){
        return sumRate;
    }

    function returnNumRate() public returns (uint){
        return numRate;
    }

    function updateDeposite(uint _value) public {
        deposit = deposit + _value;
    }

    function getDeposit() public returns (uint){
        return deposit;
    }

    function isOverdue() public returns (bool) {
        uint rentingTime = now - start;
        return rentingTime > maxDuration;
    }

    function getShareTokenListMoney() public returns(uint[]){
        uint[] money;

    //     uint sum; //The total stars in total of all the answers
    //     for (uint i = 0;i < answerList.length;i++) {
    //         if(answerList[i].answerRate >= 4){ //Only take 4 stars above into account
    //             sum += answerList[i].answerRate;
    //         }
    //     }

    //     uint proportion = deposit/sum;
    //     for (uint j = 0;j < answerList.length;j++) {
    //         if(answerList[j].answerRate >= 4){ //Only take 4 stars above into account
    //             money.push(proportion*answerList[j].answerRate);
    //         }
    //     }
    //     return money;

    // }
    // function getShareTokenListAnswerer() public returns(address[]){
    //     address[] answerer;

    //     for (uint t = 0;t < answerList.length;t++) {
    //         if(answerList[t].answerRate >= 4){ //Only take 4 stars above into account
    //             answerer.push(answerList[t].answerer);
    //         }
    //     }
    //     return answerer;
    // }

    // function getCheckShareToken() returns(uint){
    //     return checkShareToken;
    // }

    function shareToken() public {
        //uint numPeople;
        //uint sum; //The total stars in total of all the answers

        for (uint i = 0;i < answerList.length;i++) {
            if(answerList[i].answerRate >= 4){ //Only take 4 stars above into account
                // tokenSum += answerList[i].answerRate;
                numPeople++;
            }
        }
        proportion = deposit/numPeople;
        for (uint j = 0;j < answerList.length;j++) {
            if(answerList[j].answerRate >= 4){ //Only take 4 stars above into account
                answerList[j].answererP.updateToken(1, proportion);
            }
        }

        checkShareToken = 1;
    }
    
    function getSumToken() public returns(uint){
        return tokenSum;
    }

    function getNumPeople() public returns(uint){
        return numPeople;
    }

    function getProportion() public returns(uint){
        return proportion;
    }
    /**********************************************/

    function rentItem(address _renter, uint _value, address _renterP) public inState(State.PUBLISHED) payable {
        /*******************************************************/
        //require(_renter != owner);
        /*******************************************************/
        //require(_value == deposit);
        start = now;
        state = State.RENTED;
        renter = _renter;
        hasReclaim = false;
        renterP = Profile(_renterP);
    } 

    /******************************************************************************/

    function postQuestion() public {
        start = now;   
    }

    function answer(string _reply, string[] _fileHashes, string[] _fileNames, address _answerer, address _answererP) public {
        Answer memory newAnswer = Answer({
            replyHash: _reply,
            fileHashes: _fileHashes,
            fileNames: _fileNames,
            answerer: _answerer,
            answererP: Profile(_answererP),
            answerTime: now,
            answerRate: 0,
            answerNumRate: 0,
            answerSumRate: 0
        }); 
        
        answerList.push(newAnswer);
    } 


    function getAnswerList() public view returns (Answer[]) {
        return answerList;
    }

    function updateAnswerRate(uint _value, uint index) public {
        answerList[index].answerNumRate ++;
        answerList[index].answerSumRate += _value;
        answerList[index].answerRate = answerList[index].answerSumRate/answerList[index].answerNumRate;
    }

    function getAnswerRate(uint index) public view returns (uint) {
        return answerList[index].answerRate;
    }
    /******************************************************************************/

    function createRental() public restrictedToOwner inState(State.RENTED) {
        uint rentingTime = now - start;
        require(!openDisputeRenter);
        require(!openDisputeOwner);
        require(rentingTime > maxDuration);
        if (!hasReclaim) {
            ownerP.incLending(address(this), owner, renter, start, now);
        }
        state = State.DELETED;
        msg.sender.transfer(this.balance);
    }

    function allowOverdue() public returns (bool) {
        if (openDisputeRenter || openDisputeOwner) {
            return false;
        }
        uint rentingTime = now - start;
        return rentingTime > maxDuration;
    }

    function reclaimItem() public restrictedToOwner inState(State.RENTED) {
        totalRentingFee = (now - start) * rentalFee;
        hasReclaim = true;
        ownerP.incLending(address(this), owner, renter, start, now);
        state = State.AWAITPAYMENT;
    }

    function returnItem() public restrictedToRenter inState(State.AWAITPAYMENT) payable {
        require(msg.value >= totalRentingFee);
        require(!openDisputeOwner);
        uint incentiveRemain = 0;
        if (openDisputeRenter) {
            Dispute storage dispute = disputes[disputeCounts - 1];
            openDisputeRenter = false;
            dispute.complete = true;
            incentiveRemain = dispute.incentives;
        }
        state = State.IDLE;
        msg.sender.transfer(deposit + incentiveRemain);
        owner.transfer(this.balance);
        historyIndex = renterP.incBorrowing(address(this), owner, renter, start, now);
    }

    // function createDisputeRenter(string _title, string _description, string _imageHash) public restrictedToRenter inState(State.RENTED) payable {
    //     Dispute memory newDispute = Dispute({
    //        title: _title,
    //        description: _description,
    //        imageHash: _imageHash,
    //        approvalCount: 0,
    //        rejectionCount: 0,
    //        penaltyFee: 0,
    //        complete: false,
    //        startTime: now,
    //        incentives: msg.value,
    //        disputer: msg.sender
    //     }); 
        
    //     openDisputeRenter = true;
    //     disputes.push(newDispute);
    //     disputeCounts++;
    // }

    // function createDisputeOwner(string _title, string _description, string _imageHash, uint8 _penaltyFee) public restrictedToOwner inState(State.AWAITPAYMENT) payable {
        
    //     if (openDisputeRenter) {
    //         Dispute storage dispute = disputes[disputeCounts - 1];
    //         openDisputeRenter = false;
    //         dispute.complete = true;
    //         uint incentiveRemain = dispute.incentives;
    //         renter.transfer(incentiveRemain);
    //     }
        
    //     Dispute memory newDispute = Dispute({
    //        title: _title,
    //        description: _description,
    //        imageHash: _imageHash,
    //        approvalCount: 0,
    //        rejectionCount: 0,
    //        penaltyFee: _penaltyFee,
    //        complete: false,
    //        startTime: now,
    //        incentives: msg.value,
    //        disputer: msg.sender
    //     }); 
        
    //     openDisputeOwner = true;
    //     disputes.push(newDispute);
    //     disputeCounts++;
    // }


    // function payoutIncentive(uint incentives) public returns(uint) {
    //     return incentives / 2;
    // }

    // function hasVoted(address voter) public returns(bool) {
    //     Dispute storage dispute = disputes[disputeCounts - 1];
    //     if (dispute.approvals[voter] || dispute.rejections[voter]) {
    //         return true;
    //     }
    //     return false;
    // }

    // function approveDispute(uint8 index) public {
    //     Dispute storage dispute = disputes[index];
        
    //     require(!dispute.approvals[msg.sender]); 
    //     require(!dispute.rejections[msg.sender]);
    //     require(msg.sender != owner);
    //     require(msg.sender != renter);

    //     uint payout = payoutIncentive(dispute.incentives);
    //     dispute.incentives = dispute.incentives - payout;
        
    //     msg.sender.transfer(payout);
    //     dispute.approvals[msg.sender] = true;
    //     dispute.approvalCount++;
    // }

    // function rejectDispute(uint8 index) public {
    //     Dispute storage dispute = disputes[index];
        
    //     require(!dispute.approvals[msg.sender]); 
    //     require(!dispute.rejections[msg.sender]);
    //     require(msg.sender != owner);
    //     require(msg.sender != renter);

    //     uint payout = payoutIncentive(dispute.incentives);
    //     dispute.incentives = dispute.incentives - payout;
        
    //     msg.sender.transfer(payout);
    //     dispute.rejections[msg.sender] = true;
    //     dispute.rejectionCount++;
    // }

    // function finalizeDisputeFee(uint8 index) public view returns (uint) {
    //     Dispute storage dispute = disputes[index];
    //     uint rentingTime = dispute.startTime - start;
    //     return rentingTime * rentalFee;
    // }

    // function finalizeDisputeRenter(uint8 index) public {
    //     Dispute storage dispute = disputes[index];
    //     uint duration = now - dispute.startTime;

    //     require(!dispute.complete);
    //     require(duration > 1 weeks);

    //     openDisputeRenter = false;
    //     dispute.complete = true; 

    //     uint finalizeFee = finalizeDisputeFee(disputeCounts-1);

    //     if (dispute.approvalCount >= dispute.rejectionCount) {
    //         state = State.IDLE;
    //         renterP.incBorrowing(address(this), owner, renter, start, now);
    //         if (!hasReclaim) {
    //             ownerP.incLending(address(this), owner, renter, start, now);
    //         }
    //         renter.transfer(deposit - finalizeFee + dispute.incentives);
    //         owner.transfer(this.balance);
    //     }
        
    //     if (dispute.approvalCount < dispute.rejectionCount) {
    //         state = State.DELETED;
    //         renterP.incBorrowing(address(this), owner, renter, start, now);
    //         if (!hasReclaim) {
    //             ownerP.incLending(address(this), owner, renter, start, now);
    //         }
    //         owner.transfer(this.balance);
    //     }
    // }

    // function finalizeDisputeOwner(uint8 index) public {
    //     Dispute storage dispute = disputes[index];
    //     uint duration = now - dispute.startTime;

    //     require(!dispute.complete);
    //     require(duration > 1 weeks);

    //     openDisputeOwner = false;
    //     dispute.complete = true; 

    //     if (dispute.approvalCount >= dispute.rejectionCount) {
    //         state = State.IDLE;
    //         renterP.incBorrowing(address(this), owner, renter, start, now);
    //         if ((totalRentingFee + (dispute.penaltyFee * deposit / 100)) > deposit) {
    //             renter.transfer(deposit);
    //         } else {
    //             renter.transfer(deposit - totalRentingFee - (dispute.penaltyFee * deposit / 100));
    //         }
    //         owner.transfer(this.balance + dispute.incentives);
    //     }
        
    //     if (dispute.approvalCount < dispute.rejectionCount) {
    //         state = State.IDLE;
    //         renterP.incBorrowing(address(this), owner, renter, start, now);
    //         renter.transfer(deposit - totalRentingFee);
    //         owner.transfer(this.balance + dispute.incentives);
    //     }
    // }

}

contract Profile {

    struct HistoryRental {
        address productId;
        address owner;
        address renter;
        bool isOwner;
        bool hasRated;
        uint start;
        uint end;
    }

    struct Rating {
        uint8 rate;
        address rater;
        string comment;
        bytes8 role;
        address productId;
    }

    HistoryRental[] public historyRental;
    Rating[] public ratings;
    uint8 public ratingCounts;
    uint8 public timesLending;
    uint8 public timesBorrowing;
    uint public token = 10;

    address public user;

    modifier restricted(){
        require(msg.sender != user);
        _;  
    }

    function Profile (address _user) public {
        user = _user;
    }

    function getHistoryCount() public returns(uint) {
        return historyRental.length;
    }

    function updateRated(uint8 index) public {
        HistoryRental storage history = historyRental[index];
        history.hasRated = true;
    }

    function incLending(address _product, address _owner, address _renter, uint _start, uint _end) public returns(uint) {
        timesLending++;

        HistoryRental memory history = HistoryRental({
            productId: _product,
            owner: _owner,
            renter: _renter,
            isOwner: true,
            hasRated: false,
            start: _start,
            end: _end
        });

        historyRental.push(history);
        return historyRental.length - 1;
    }

    function incBorrowing(address _product, address _owner, address _renter, uint _start, uint _end) public returns(uint) {
        timesBorrowing++;
        
        HistoryRental memory history = HistoryRental({
            productId: _product,
            owner: _owner,
            renter: _renter,
            isOwner: false,
            hasRated: false,
            start: _start,
            end: _end
        });

        historyRental.push(history);
        return historyRental.length - 1;
    }

    function inputRating(uint8 _rate, string _comment, bytes8 _role, address _productId, address raterP, uint8 index) public restricted {
        Profile raterProfile = Profile(raterP);
        raterProfile.updateRated(index);

        Rating memory newRating = Rating({
            rate: _rate,
            rater: msg.sender,
            comment: _comment,
            role: _role,
            productId: _productId
        });

        ratings.push(newRating);
        ratingCounts++;
    }

    function getSumRating() public returns(uint) {
        uint sum = 0;
        for (uint i = 0;i < ratingCounts;i++) {
            sum += ratings[i].rate;
        }
        return sum;
    }

    function updateToken(uint addOrSub, uint _token) public {
        if (addOrSub==1){ //1 is add
            token += (_token);
        }
        else if(addOrSub==0){ // 0 is sub
            token -= (_token);
        }
    }

    function getToken() public returns(uint){
        return token;
    }
}
