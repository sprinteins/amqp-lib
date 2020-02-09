build:
	@./make-scripts/make-build.sh amqp-lib

dev:
	@./make-scripts/make-dev.sh amqp-lib 

run: 
	@./make-scripts/make-run.sh amqp-lib 

run-debug: 
	@./make-scripts/make-run-debug.sh amqp-lib 

run-profiling: 
	@./make-scripts/make-run-profiling.sh amqp-lib 

dev-debug: 
	@./make-scripts/make-dev-debug.sh amqp-lib 

sh:
	@./make-scripts/make-sh.sh amqp-lib 

test-ci:
	@./make-scripts/make-test-ci.sh amqp-lib 